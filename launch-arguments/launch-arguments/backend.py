"""Launch Arguments for Framey: build Steam launch options from tappable building blocks.

Runs inside the Framey loader's single event loop: nothing here may block the loop,
and only the standard library is used. Disk and Steam work runs in worker threads.

Launch options are read from and written to Steam's main page ("SharedJSContext") over
the local debug port, the same way SteamGridDB for Framey refreshes artwork:
SteamClient.Apps.SetAppLaunchOptions(appid, text). When that page is not reachable,
the current options are read from localconfig.vdf / shortcuts.vdf (read only).
"""
import asyncio
import base64
import hashlib
import json
import os
import re
import socket
import struct
import threading
import time
import urllib.parse
import urllib.request
import zlib
from pathlib import Path

CONF = Path.home() / ".config" / "framey" / "launch-arguments.json"
TOTAL = 30            # seconds per call, seen from the event loop
MAX_OPTS = 1024       # characters of one launch option line
MAX_CUSTOM = 100      # saved custom building blocks
LANGS = ("de", "en")
SKIP = re.compile(r"^(Proton|Steam Linux Runtime|Steamworks Common|Steam Audio)", re.I)
RE_APPID = re.compile(r"[0-9]{1,10}")


class _Err(Exception):
    def __init__(self, code):
        Exception.__init__(self, code)
        self.code = code


async def _run(fn, *args):
    loop = asyncio.get_running_loop()
    return await asyncio.wait_for(loop.run_in_executor(None, fn, *args), TOTAL)


# ---- settings -------------------------------------------------------------
# {"lang": "de", "custom": [{"id", "label", "value"}], "orig": {appid: "launch options before the first change"}}

_CFG_LOCK = threading.Lock()


def _load():
    try:
        d = json.loads(CONF.read_text())
    except (OSError, ValueError):
        return {}
    return d if isinstance(d, dict) else {}


def _write(d):
    CONF.parent.mkdir(parents=True, exist_ok=True)
    tmp = CONF.with_suffix(".tmp")
    with open(str(tmp), "w") as f:
        json.dump(d, f, indent=1, ensure_ascii=False)
    os.replace(str(tmp), str(CONF))


def _update(mutator):
    with _CFG_LOCK:
        d = _load()
        res = mutator(d)
        _write(d)
        return res


def _clean_text(s, limit):
    if not isinstance(s, str):
        return None
    s = s.replace("\r", " ").replace("\n", " ").replace("\t", " ").replace("\0", "")
    s = s.strip()
    return s[:limit]


def _clean_custom(d):
    out, seen = [], set()
    c = d.get("custom")
    for v in c if isinstance(c, list) else []:
        if not isinstance(v, dict):
            continue
        value = _clean_text(v.get("value"), 300)
        if not value:
            continue
        cid = str(v.get("id") or "")
        if not re.fullmatch(r"[0-9a-z]{1,16}", cid) or cid in seen:
            cid = hashlib.sha1(value.encode("utf-8")).hexdigest()[:10]
        if cid in seen:
            continue
        seen.add(cid)
        out.append({"id": cid, "label": _clean_text(v.get("label"), 60) or "", "value": value})
    return out[:MAX_CUSTOM]


def _clean_orig(d):
    out = {}
    o = d.get("orig")
    if isinstance(o, dict):
        for k, v in o.items():
            if RE_APPID.fullmatch(str(k)) and isinstance(v, str):
                out[str(k)] = v[:MAX_OPTS]
    return out


def _conf():
    d = _load()
    lang = d.get("lang")
    return {"lang": lang if lang in LANGS else None, "custom": _clean_custom(d),
            "backups": sorted(_clean_orig(d))}


def _set_lang(code):
    if code not in LANGS:
        raise _Err("bad_arg")
    _update(lambda d: d.__setitem__("lang", code))
    return {"ok": True}


def _add_custom(value, label):
    value = _clean_text(value, 300)
    label = _clean_text(label, 60) or ""
    if not value:
        raise _Err("bad_arg")

    def mut(d):
        c = _clean_custom(d)
        for v in c:
            if v["value"] == value:
                if label:
                    v["label"] = label
                d["custom"] = c
                return v
        if len(c) >= MAX_CUSTOM:
            raise _Err("too_many")
        cid = hashlib.sha1(("%s|%f" % (value, time.time())).encode("utf-8")).hexdigest()[:10]
        item = {"id": cid, "label": label, "value": value}
        c.append(item)
        d["custom"] = c
        return item
    return {"item": _update(mut)}


def _del_custom(cid):
    def mut(d):
        d["custom"] = [v for v in _clean_custom(d) if v["id"] != cid]
    _update(mut)
    return {"ok": True}


# ---- Steam folders --------------------------------------------------------

def _steam_root():
    home = Path.home()
    for rel in (".local/share/Steam", ".steam/steam", ".steam/root"):
        r = home / rel
        if (r / "userdata").is_dir():
            return r.resolve()
    return None


def _users():
    """Steam user folders, most recently used first."""
    root = _steam_root()
    if root is None:
        raise _Err("no_steam")
    out = []
    for d in (root / "userdata").iterdir():
        if not (d.name.isdigit() and d.name != "0" and d.is_dir()):
            continue
        try:
            t = (d / "config" / "localconfig.vdf").stat().st_mtime
        except OSError:
            t = 0.0
        out.append((t, d))
    out.sort(key=lambda x: -x[0])
    return [d for _t, d in out]


def _vdf_bin(data):
    """Binary VDF (shortcuts.vdf) -> dict with lower-case keys."""
    pos, n = 0, len(data)

    def cstr():
        nonlocal pos
        e = data.find(b"\0", pos)
        if e < 0:
            raise ValueError("bad vdf")
        s = data[pos:e].decode("utf-8", "replace")
        pos = e + 1
        return s

    def node(depth):
        nonlocal pos
        res = {}
        while pos < n:
            t = data[pos]
            pos += 1
            if t == 8:
                return res
            k = cstr().lower()
            if t == 0:
                if depth > 6:
                    raise ValueError("too deep")
                res[k] = node(depth + 1)
            elif t == 1:
                res[k] = cstr()
            elif t == 2:
                if pos + 4 > n:
                    raise ValueError("short")
                res[k] = struct.unpack_from("<I", data, pos)[0]
                pos += 4
            else:
                raise ValueError("type")
        return res
    return node(0)


def _shortcuts():
    """Non-Steam shortcuts of every Steam user: appid -> {name, opts}."""
    out = {}
    try:
        users = _users()
    except (_Err, OSError):
        return out
    for u in users:
        try:
            top = _vdf_bin((u / "config" / "shortcuts.vdf").read_bytes()[:4000000])
        except (OSError, ValueError, struct.error):
            continue
        top = top.get("shortcuts", top)
        for v in top.values() if isinstance(top, dict) else []:
            if not isinstance(v, dict):
                continue
            name = v.get("appname") if isinstance(v.get("appname"), str) else ""
            aid = v.get("appid")
            if not isinstance(aid, int):          # older entries: Steam derives the id from exe + name
                exe = v.get("exe") if isinstance(v.get("exe"), str) else ""
                aid = (zlib.crc32((exe + name).encode("utf-8")) & 0xFFFFFFFF) | 0x80000000
            opts = v.get("launchoptions") if isinstance(v.get("launchoptions"), str) else ""
            if name:
                out.setdefault(str(aid & 0xFFFFFFFF), {"name": name, "opts": opts})
    return out


def _manifests():
    """appid -> name of every installed Steam app (from the appmanifest files)."""
    root = _steam_root()
    if root is None:
        raise _Err("no_steam")
    libs, seen = [root], {str(root)}
    try:
        txt = (root / "steamapps" / "libraryfolders.vdf").read_text(errors="replace")
        for m in re.finditer(r'"path"\s+"([^"]+)"', txt):
            p = Path(m.group(1).replace("\\\\", "\\"))
            if str(p) not in seen:
                seen.add(str(p))
                libs.append(p)
    except OSError:
        pass
    out = {}
    for lib in libs:
        try:
            files = sorted((lib / "steamapps").glob("appmanifest_*.acf"))
        except OSError:
            continue
        for f in files:
            try:
                t = f.read_text(errors="replace")
            except OSError:
                continue
            a = re.search(r'"appid"\s+"([0-9]+)"', t)
            nm = re.search(r'"name"\s+"([^"]*)"', t)
            if not a or not nm or a.group(1) in out or SKIP.match(nm.group(1)):
                continue
            out[a.group(1)] = nm.group(1)
    return out


def _games():
    names = _manifests()
    sc = _shortcuts()
    backups = set(_clean_orig(_load()))
    out = []
    for appid, name in names.items():
        out.append({"appid": appid, "name": name, "shortcut": False, "changed": appid in backups})
    for appid, v in sc.items():
        if appid not in names:
            out.append({"appid": appid, "name": v["name"], "shortcut": True, "changed": appid in backups})
    out.sort(key=lambda g: (g["shortcut"], g["name"].lower(), int(g["appid"])))
    return {"games": out}


# ---- reading launch options from disk (fallback) ----------------------------

_TOK = re.compile(r'"((?:[^"\\]|\\.)*)"|([{}])')


def _unesc(s):
    return re.sub(r"\\(.)", lambda m: {"n": "\n", "t": "\t"}.get(m.group(1), m.group(1)), s)


def _local_opts(appid):
    """LaunchOptions of a Steam game from localconfig.vdf (text VDF), or None."""
    for u in _users():
        f = u / "config" / "localconfig.vdf"
        try:
            if f.stat().st_size > 64 * 1024 * 1024:
                continue
            txt = f.read_text(errors="replace")
        except OSError:
            continue
        # Walk the token stream and remember the key path; only the apps/<appid> block matters.
        path, key = [], None
        for m in _TOK.finditer(txt):
            s, brace = m.group(1), m.group(2)
            if brace == "{":
                path.append((key or "").lower())
                key = None
            elif brace == "}":
                if path:
                    path.pop()
                key = None
            elif key is None:
                key = _unesc(s)
            else:
                if (key.lower() == "launchoptions" and len(path) >= 2 and path[-1] == appid
                        and path[-2] == "apps"):
                    return _unesc(s)
                key = None
        return ""            # found the user's file, but this game has no launch options yet
    return None


# ---- Steam's main page over the local debug port ---------------------------
WS_GUID = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11"
CDP_PORTS = range(8080, 8091)

EXPR_GET = (
    '(async()=>{try{const id=%d;'
    'try{const s=window.appDetailsStore;const d=s&&s.GetAppDetails&&s.GetAppDetails(id);'
    'if(d&&typeof d.strLaunchOptions==="string")return JSON.stringify({opts:d.strLaunchOptions})}catch(e){}'
    'const a=window.SteamClient&&window.SteamClient.Apps;'
    'if(!a||typeof a.RegisterForAppDetails!=="function")return JSON.stringify({err:"missing"});'
    'return await new Promise(function(res){let done=false,reg=null;'
    'const fin=function(v){if(done)return;done=true;try{reg&&reg.unregister&&reg.unregister()}catch(e){}res(v)};'
    'setTimeout(function(){fin(JSON.stringify({err:"timeout"}))},4000);'
    'reg=a.RegisterForAppDetails(id,function(d){if(d&&typeof d.strLaunchOptions==="string")'
    'fin(JSON.stringify({opts:d.strLaunchOptions}))});'
    'if(done)try{reg&&reg.unregister&&reg.unregister()}catch(e){}})'
    '}catch(e){return JSON.stringify({err:"error:"+String(e&&e.message||e)})}})()')
EXPR_SET = (
    '(async()=>{try{const a=window.SteamClient&&window.SteamClient.Apps;'
    'if(!a||typeof a.SetAppLaunchOptions!=="function")return "missing";'
    'await a.SetAppLaunchOptions(%d,%s);return "ok"}'
    'catch(e){return "error:"+String(e&&e.message||e)}})()')


def _cdp_target():
    op = urllib.request.build_opener(urllib.request.ProxyHandler({}))
    for port in CDP_PORTS:
        try:
            with op.open("http://127.0.0.1:%d/json/list" % port, timeout=1) as r:
                data = json.loads(r.read(300000).decode("utf-8", "replace"))
        except Exception:
            continue
        for t in data if isinstance(data, list) else []:
            if isinstance(t, dict) and "sharedjscontext" in str(t.get("title", "")).lower():
                ws = t.get("webSocketDebuggerUrl")
                if isinstance(ws, str):
                    path = urllib.parse.urlparse(ws).path
                    if path.startswith("/devtools/"):
                        return port, path
    raise _Err("no_target")


class _WS:
    """Minimal WebSocket client (text frames only), enough for Runtime.evaluate."""

    def __init__(self, port, path):
        s = socket.create_connection(("127.0.0.1", port), timeout=10)
        s.settimeout(10)
        key = base64.b64encode(os.urandom(16)).decode("ascii")
        s.sendall(("GET %s HTTP/1.1\r\nHost: 127.0.0.1:%d\r\nUpgrade: websocket\r\nConnection: Upgrade\r\n"
                   "Sec-WebSocket-Key: %s\r\nSec-WebSocket-Version: 13\r\n\r\n" % (path, port, key)).encode("ascii"))
        buf = b""
        while b"\r\n\r\n" not in buf:
            c = s.recv(4096)
            if not c or len(buf) > 16384:
                s.close()
                raise _Err("cdp_failed")
            buf += c
        head, _, rest = buf.partition(b"\r\n\r\n")
        want = base64.b64encode(hashlib.sha1((key + WS_GUID).encode("ascii")).digest())
        if not head.startswith(b"HTTP/1.1 101") or want not in head:
            s.close()
            raise _Err("cdp_failed")
        self.s, self.buf = s, rest

    def _send_frame(self, op, payload):
        n = len(payload)
        if n < 126:
            head = bytes([0x80 | op, 0x80 | n])
        elif n < 65536:
            head = bytes([0x80 | op, 0xFE]) + struct.pack(">H", n)
        else:
            head = bytes([0x80 | op, 0xFF]) + struct.pack(">Q", n)
        mask = os.urandom(4)
        body = b""
        if n:
            m = (mask * (n // 4 + 1))[:n]
            body = (int.from_bytes(payload, "big") ^ int.from_bytes(m, "big")).to_bytes(n, "big")
        self.s.sendall(head + mask + body)

    def send(self, text):
        self._send_frame(1, text.encode("utf-8"))

    def _need(self, n):
        while len(self.buf) < n:
            c = self.s.recv(65536)
            if not c:
                raise _Err("cdp_closed")
            self.buf += c

    def recv(self, limit=1 << 20):
        data = b""
        while True:
            self._need(2)
            b0, b1 = self.buf[0], self.buf[1]
            op, ln, pos = b0 & 0x0F, b1 & 0x7F, 2
            if ln == 126:
                self._need(4)
                ln, pos = struct.unpack(">H", self.buf[2:4])[0], 4
            elif ln == 127:
                self._need(10)
                ln, pos = struct.unpack(">Q", self.buf[2:10])[0], 10
            if ln > limit:
                raise _Err("cdp_big")
            mask = b""
            if b1 & 0x80:
                self._need(pos + 4)
                mask, pos = self.buf[pos:pos + 4], pos + 4
            self._need(pos + ln)
            payload = self.buf[pos:pos + ln]
            self.buf = self.buf[pos + ln:]
            if mask and ln:
                m = (mask * (ln // 4 + 1))[:ln]
                payload = (int.from_bytes(payload, "big") ^ int.from_bytes(m, "big")).to_bytes(ln, "big")
            if op == 8:
                raise _Err("cdp_closed")
            if op == 9:
                self._send_frame(0xA, payload)
                continue
            if op == 0xA:
                continue
            data += payload
            if len(data) > limit:
                raise _Err("cdp_big")
            if b0 & 0x80:
                return data

    def close(self):
        try:
            self._send_frame(8, b"")
        except OSError:
            pass
        try:
            self.s.close()
        except OSError:
            pass


def _eval(expr):
    port, path = _cdp_target()
    ws = _WS(port, path)
    try:
        ws.send(json.dumps({"id": 1, "method": "Runtime.evaluate",
                            "params": {"expression": expr, "awaitPromise": True, "returnByValue": True}}))
        end = time.time() + 20
        while time.time() < end:
            msg = json.loads(ws.recv().decode("utf-8", "replace"))
            if msg.get("id") == 1:
                res = msg.get("result") or {}
                if msg.get("error") or res.get("exceptionDetails"):
                    raise _Err("cdp_exception")
                return (res.get("result") or {}).get("value")
        raise _Err("timeout")
    finally:
        ws.close()


def _cdp_get(appid):
    try:
        r = json.loads(_eval(EXPR_GET % int(appid)) or "{}")
    except (_Err, OSError, ValueError, TypeError):
        return None
    if isinstance(r, dict) and isinstance(r.get("opts"), str):
        return r["opts"]
    return None


# ---- launch options ----------------------------------------------------------

def _get(appid):
    live = _cdp_get(appid)
    if live is not None:
        return {"opts": live, "live": True}
    sc = _shortcuts().get(appid)
    if sc is not None:
        return {"opts": sc["opts"], "live": False}
    opts = _local_opts(appid)
    return {"opts": opts or "", "live": False}


def _remember_orig(appid, before):
    def mut(d):
        o = _clean_orig(d)
        if appid not in o and len(o) < 2000:
            o[appid] = before
        d["orig"] = o
    _update(mut)


def _set(appid, opts, before):
    res = _eval(EXPR_SET % (int(appid), json.dumps(opts)))
    if res == "missing":
        raise _Err("api_missing")
    if res != "ok":
        raise _Err("cdp:" + str(res)[:80])
    if isinstance(before, str):
        _remember_orig(appid, before[:MAX_OPTS])
    after = _cdp_get(appid)
    return {"ok": True, "opts": after if after is not None else opts}


def _restore(appid):
    orig = _clean_orig(_load()).get(appid)
    if orig is None:
        raise _Err("no_backup")
    res = _set(appid, orig, None)

    def mut(d):
        o = _clean_orig(d)
        o.pop(appid, None)
        d["orig"] = o
    _update(mut)
    return res


# ---- icons (small cached images from Steam's library cache) -------------------

ICON_MAX = 2 * 1024 * 1024


def _sniff(b):
    if b[:8] == b"\x89PNG\r\n\x1a\n":
        return "png"
    if b[:3] == b"\xff\xd8\xff":
        return "jpeg"
    return None


def _icon_files(appid):
    root = _steam_root()
    out = []
    if root is None:
        return out
    lib = root / "appcache" / "librarycache"
    sub = lib / appid
    try:
        grids = [u / "config" / "grid" for u in _users()]
    except (_Err, OSError):
        grids = []
    for g in grids[:1]:
        out += [g / ("%s_icon.%s" % (appid, e)) for e in ("png", "jpg")]
    out += [lib / ("%s_icon.jpg" % appid)]
    try:
        if sub.is_dir():
            files = [f for f in sub.iterdir() if f.is_file()]
            out += sorted((f for f in files if "icon" in f.name.lower()), key=lambda f: f.name)
            hexed = [f for f in files if re.fullmatch(r"[0-9a-f]{40}\.(jpg|png)", f.name)]

            def size(f):
                try:
                    return f.stat().st_size
                except OSError:
                    return 1 << 30
            out += sorted(hexed, key=size)
    except OSError:
        pass
    for g in grids[:1]:
        out += [g / ("%sp.%s" % (appid, e)) for e in ("png", "jpg")]
    out += [lib / ("%s_library_600x900.jpg" % appid), sub / "library_600x900.jpg"]
    return out


def _icon_one(appid):
    for f in _icon_files(appid):
        try:
            if not f.is_file() or f.stat().st_size > ICON_MAX:
                continue
            data = f.read_bytes()
        except OSError:
            continue
        mime = _sniff(data)
        if mime:
            return "data:image/%s;base64,%s" % (mime, base64.b64encode(data).decode("ascii"))
    return ""


def _icons(appids):
    return {"icons": {a: _icon_one(a) for a in appids}}


def _probe():
    """Diagnostics: is Steam's main page reachable, and does it offer the needed calls?"""
    expr = ('JSON.stringify((function(){var a=window.SteamClient&&window.SteamClient.Apps;'
            'return {apps:typeof a,set:typeof (a&&a.SetAppLaunchOptions),'
            'details:typeof (a&&a.RegisterForAppDetails),store:typeof window.appDetailsStore}})())')
    try:
        return {"cdp": json.loads(_eval(expr) or "{}"), "steam": _steam_root() is not None}
    except (_Err, OSError, ValueError) as e:
        return {"cdp": str(getattr(e, "code", e)), "steam": _steam_root() is not None}


# ---- entry point ----------------------------------------------------------

def _appid(arg):
    a = str(arg.get("appid", "")) if isinstance(arg, dict) else ""
    if not RE_APPID.fullmatch(a):
        raise _Err("bad_appid")
    return a


async def call(method, arg):
    try:
        if method == "conf":
            return await _run(_conf)
        if method == "games":
            return await _run(_games)
        if method == "set_lang":
            return await _run(_set_lang, arg.get("lang") if isinstance(arg, dict) else None)
        if method == "add_custom":
            if not isinstance(arg, dict):
                raise _Err("bad_arg")
            return await _run(_add_custom, arg.get("value"), arg.get("label"))
        if method == "del_custom":
            cid = arg.get("id") if isinstance(arg, dict) else None
            if not (isinstance(cid, str) and re.fullmatch(r"[0-9a-z]{1,16}", cid)):
                raise _Err("bad_arg")
            return await _run(_del_custom, cid)
        if method == "get":
            return await _run(_get, _appid(arg))
        if method == "set":
            appid = _appid(arg)
            opts = arg.get("opts")
            before = arg.get("before")
            if not isinstance(opts, str) or len(opts) > MAX_OPTS or "\0" in opts or "\n" in opts:
                raise _Err("bad_arg")
            if before is not None and not isinstance(before, str):
                raise _Err("bad_arg")
            return await _run(_set, appid, opts.strip(), before)
        if method == "remember":
            appid = _appid(arg)
            before = arg.get("before")
            if not isinstance(before, str):
                raise _Err("bad_arg")
            await _run(_remember_orig, appid, before[:MAX_OPTS])
            return {"ok": True}
        if method == "forget_backup":
            appid = _appid(arg)

            def mut(d):
                o = _clean_orig(d)
                o.pop(appid, None)
                d["orig"] = o
            await _run(_update, mut)
            return {"ok": True}
        if method == "backup":
            appid = _appid(arg)
            orig = (await _run(_load)).get("orig")
            v = orig.get(appid) if isinstance(orig, dict) else None
            return {"orig": v if isinstance(v, str) else None}
        if method == "restore":
            return await _run(_restore, _appid(arg))
        if method == "icons":
            ids = arg.get("appids") if isinstance(arg, dict) else None
            if not (isinstance(ids, list) and len(ids) <= 16 and all(isinstance(a, str) and RE_APPID.fullmatch(a) for a in ids)):
                raise _Err("bad_arg")
            return await _run(_icons, ids)
        if method == "probe":
            return await _run(_probe)
        return {"error": "unknown_method"}
    except _Err as e:
        return {"error": e.code}
    except asyncio.TimeoutError:
        return {"error": "timeout"}
    except OSError:
        return {"error": "io"}
    except ValueError as e:
        return {"error": "bad_data:%s:%s" % (method, str(e)[:60])}
