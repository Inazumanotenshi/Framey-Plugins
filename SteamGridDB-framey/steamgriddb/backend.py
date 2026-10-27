"""SteamGridDB for Framey: pick artwork from SteamGridDB, write it into Steam's grid folder.

Runs inside the Framey loader's single event loop: nothing here may block the loop,
and only the standard library is used. Network and disk work runs in worker threads
with timeouts and size caps.
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
import zlib
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

API = "https://www.steamgriddb.com/api/v2"
CONF = Path.home() / ".config" / "framey" / "steamgriddb.json"
UA = "framey-steamgriddb/0.1"
MAX_JSON = 2 * 1024 * 1024
MAX_IMG = 6 * 1024 * 1024
MAX_THUMB = 400 * 1024
MAX_LIVE = 3 * 1024 * 1024   # bigger images take the file route: the loader has little memory
TIMEOUT = 15   # per socket operation
TOTAL = 45     # per call, seen from the event loop
EXTS = ("png", "jpg", "jpeg", "webp", "ico")
RASTER = "image/png,image/jpeg"
LANGS = ("de", "en", "fr", "es", "it", "pt")

# kind -> (API endpoint, extra query, Steam grid file name pattern)
KINDS = {
    "grid_p": ("grids", {"dimensions": "600x900,342x482,660x930", "mimes": RASTER}, "{}p"),
    "grid_w": ("grids", {"dimensions": "460x215,920x430", "mimes": RASTER}, "{}"),
    "hero": ("heroes", {"mimes": RASTER}, "{}_hero"),
    "logo": ("logos", {"mimes": "image/png"}, "{}_logo"),
    "icon": ("icons", {"mimes": "image/png,image/vnd.microsoft.icon"}, "{}_icon"),
}
SKIP = re.compile(r"^(Proton|Steam Linux Runtime|Steamworks Common)", re.I)


class _Err(Exception):
    def __init__(self, code):
        Exception.__init__(self, code)
        self.code = code


def _host_ok(url):
    try:
        u = urllib.parse.urlparse(url)
    except ValueError:
        return False
    h = (u.hostname or "").lower()
    return u.scheme == "https" and (h == "steamgriddb.com" or h.endswith(".steamgriddb.com"))


class _Redirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        if not _host_ok(newurl):
            raise urllib.error.URLError("redirect blocked")
        return urllib.request.HTTPRedirectHandler.redirect_request(
            self, req, fp, code, msg, headers, newurl)


_opener = urllib.request.build_opener(_Redirect)


def _get(url, headers, limit):
    if not _host_ok(url):
        raise _Err("bad_url")
    req = urllib.request.Request(url, headers=headers)
    with _opener.open(req, timeout=TIMEOUT) as r:
        data = r.read(limit + 1)
    if len(data) > limit:
        raise _Err("too_large")
    return data


def _sniff(b):
    if b[:8] == b"\x89PNG\r\n\x1a\n":
        return "png"
    if b[:3] == b"\xff\xd8\xff":
        return "jpg"
    if b[:4] == b"RIFF" and b[8:12] == b"WEBP":
        return "webp"
    return None


def _png(w, h, rgba):
    raw = b"".join(b"\0" + rgba[y * w * 4:(y + 1) * w * 4] for y in range(h))

    def chunk(tag, body):
        c = tag + body
        return struct.pack(">I", len(body)) + c + struct.pack(">I", zlib.crc32(c) & 0xFFFFFFFF)
    return (b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", w, h, 8, 6, 0, 0, 0))
            + chunk(b"IDAT", zlib.compress(raw, 6)) + chunk(b"IEND", b""))


def _ico_to_png(data):
    """Largest image of an .ico file as PNG (stdlib only). Raises _Err('bad_image') if unsupported."""
    try:
        reserved, kind, count = struct.unpack_from("<HHH", data, 0)
        if reserved != 0 or kind != 1 or not 0 < count <= 64:
            raise _Err("bad_image")
        best = None
        for i in range(count):
            w, h, _c, _r, _p, bpp, size, off = struct.unpack_from("<BBBBHHII", data, 6 + 16 * i)
            score = (w or 256) * (h or 256) * 1000 + bpp
            if off + size <= len(data) and size > 0 and (best is None or score > best[0]):
                best = (score, off, size)
        if best is None:
            raise _Err("bad_image")
        img = data[best[1]:best[1] + best[2]]
        if img[:8] == b"\x89PNG\r\n\x1a\n":
            return img
        hdr, w, h2, _pl, bpp, comp = struct.unpack_from("<IiiHHI", img, 0)
        h = h2 // 2
        if comp != 0 or hdr < 40 or not (0 < w <= 512 and 0 < h <= 512) or bpp not in (1, 4, 8, 24, 32):
            raise _Err("bad_image")
        ncol = struct.unpack_from("<I", img, 32)[0] or (1 << bpp if bpp <= 8 else 0)
        pal = []
        if bpp <= 8:
            for k in range(ncol):
                b_, g_, r_, _a = struct.unpack_from("<BBBB", img, hdr + 4 * k)
                pal.append((r_, g_, b_))
        px0 = hdr + 4 * (ncol if bpp <= 8 else 0)
        stride = ((w * bpp + 31) // 32) * 4
        mstride = ((w + 31) // 32) * 4
        mask0 = px0 + stride * h
        out = bytearray(w * h * 4)
        has_alpha = False
        for y in range(h):
            row = img[px0 + stride * (h - 1 - y):px0 + stride * (h - y)]
            mrow = img[mask0 + mstride * (h - 1 - y):mask0 + mstride * (h - y)]
            for x in range(w):
                if bpp == 32:
                    b_, g_, r_, a_ = row[4 * x:4 * x + 4]
                    has_alpha = has_alpha or a_ > 0
                elif bpp == 24:
                    b_, g_, r_ = row[3 * x:3 * x + 3]
                    a_ = 255
                else:
                    if bpp == 8:
                        idx = row[x]
                    elif bpp == 4:
                        idx = (row[x // 2] >> (4 if x % 2 == 0 else 0)) & 15
                    else:
                        idx = (row[x // 8] >> (7 - x % 8)) & 1
                    r_, g_, b_ = pal[idx] if idx < len(pal) else (0, 0, 0)
                    a_ = 255
                if bpp != 32 or not has_alpha:
                    if mrow and len(mrow) > x // 8 and (mrow[x // 8] >> (7 - x % 8)) & 1:
                        a_ = 0
                    elif bpp == 32:
                        a_ = 255
                o = (y * w + x) * 4
                out[o:o + 4] = bytes((r_, g_, b_, a_))
        if bpp == 32 and has_alpha:                  # real alpha channel: ignore the AND mask
            pass
        return _png(w, h, bytes(out))
    except (struct.error, IndexError, ValueError):
        raise _Err("bad_image")


def _image(data):
    """(extension, bytes) for PNG/JPEG/WebP; .ico files are converted to PNG."""
    if data[:4] == b"\0\0\1\0":
        data = _ico_to_png(data)
    return _sniff(data), data


async def _run(fn, *args):
    loop = asyncio.get_running_loop()
    return await asyncio.wait_for(loop.run_in_executor(None, fn, *args), TOTAL)


# ---- settings -------------------------------------------------------------

def _load():
    try:
        d = json.loads(CONF.read_text())
    except (OSError, ValueError):
        return {}
    return d if isinstance(d, dict) else {}


def _write(d):
    CONF.parent.mkdir(parents=True, exist_ok=True)
    tmp = CONF.with_suffix(".tmp")
    fd = os.open(str(tmp), os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
    with os.fdopen(fd, "w") as f:
        json.dump(d, f)
    os.replace(str(tmp), str(CONF))


_CFG_LOCK = threading.Lock()


def _update(mutator):
    with _CFG_LOCK:
        d = _load()
        mutator(d)
        _write(d)
        return d


def _clean_map(d):
    """appid -> {gid, name}: apps matched by hand to a SteamGridDB game."""
    out = {}
    mp = d.get("map")
    if isinstance(mp, dict):
        for k, v in mp.items():
            if (re.fullmatch(r"[0-9]{1,10}", str(k)) and isinstance(v, dict)
                    and isinstance(v.get("gid"), int) and not isinstance(v.get("gid"), bool)):
                out[str(k)] = {"gid": v["gid"], "name": str(v.get("name", ""))[:80]}
    return out


def _clean_unknown(d):
    """appid -> local name ('' if none): apps SteamGridDB did not recognise."""
    out = {}
    u = d.get("unknown")
    if isinstance(u, dict):
        for k, v in u.items():
            if re.fullmatch(r"[0-9]{1,10}", str(k)):
                out[str(k)] = str(v or "")[:80]
    return out


KEY_FILE = "steamgriddb-key.txt"      # optional: put the API key in this file in the home folder


def _key():
    k = _load().get("api_key")
    if isinstance(k, str) and k:
        return k
    try:                                  # no key saved yet: import it from the key file, if there is one
        with open(Path.home() / KEY_FILE, "r", errors="replace") as f:
            k = f.read(4096).strip()
    except OSError:
        return ""
    if not re.fullmatch(r"[0-9A-Za-z]{16,64}", k):
        return ""
    try:
        _update(lambda d: d.__setitem__("api_key", k))
    except OSError:
        pass
    return k


def _save_key(k):
    k = k.strip() if isinstance(k, str) else ""
    if not re.fullmatch(r"[0-9A-Za-z]{16,64}", k):
        raise _Err("bad_key_format")
    _update(lambda d: d.__setitem__("api_key", k))
    return {"ok": True}


def _set_lang(code):
    if code not in LANGS:
        raise _Err("bad_arg")
    _update(lambda d: d.__setitem__("lang", code))
    return {"ok": True}


# ---- Steam folders --------------------------------------------------------

def _steam_root():
    home = Path.home()
    for rel in (".local/share/Steam", ".steam/steam", ".steam/root"):
        r = home / rel
        if (r / "userdata").is_dir():
            return r.resolve()
    return None


def _grid_dir(create=True):
    root = _steam_root()
    if root is None:
        raise _Err("no_steam")
    best, best_t = None, -1.0
    for d in (root / "userdata").iterdir():
        if not (d.name.isdigit() and d.name != "0" and d.is_dir()):
            continue
        try:
            t = (d / "config" / "localconfig.vdf").stat().st_mtime
        except OSError:
            t = 0.0
        if t > best_t:
            best, best_t = d, t
    if best is None:
        raise _Err("no_user")
    g = best / "config" / "grid"
    if create:
        g.mkdir(parents=True, exist_ok=True)
    return g


def _parse_shortcuts(data):
    """Minimal reader for Steam's binary shortcuts.vdf -> list of (unsigned appid, name)."""
    out, pos, n = [], 0, len(data)

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
    try:
        root = node(0)
    except (ValueError, struct.error):
        return out
    top = root.get("shortcuts", root)
    if isinstance(top, dict):
        for v in top.values():
            if not isinstance(v, dict):
                continue
            name = v.get("appname") if isinstance(v.get("appname"), str) else ""
            aid = v.get("appid")
            if not isinstance(aid, int):          # older entries: Steam derives the id from exe + name
                exe = v.get("exe") if isinstance(v.get("exe"), str) else ""
                aid = (zlib.crc32((exe + name).encode("utf-8")) & 0xFFFFFFFF) | 0x80000000
            if name:
                out.append((str(aid & 0xFFFFFFFF), name))
    return out


def _shortcuts():
    """Non-Steam shortcuts of every Steam user: appid -> name."""
    out = {}
    root = _steam_root()
    if root is None:
        return out
    try:
        users = sorted((root / "userdata").iterdir())
    except OSError:
        return out
    for u in users:
        if not (u.name.isdigit() and u.name != "0"):
            continue
        try:
            raw = (u / "config" / "shortcuts.vdf").read_bytes()
        except OSError:
            continue
        for aid, name in _parse_shortcuts(raw[:2000000]):
            out.setdefault(aid, name)
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
            p = Path(m.group(1))
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
            n = re.search(r'"name"\s+"([^"]*)"', t)
            if not a or not n or a.group(1) in out or SKIP.match(n.group(1)):
                continue
            out[a.group(1)] = n.group(1)
    for aid, name in _shortcuts().items():
        out.setdefault(aid, name)
    return out


def _games():
    names = _manifests()
    d = _load()
    mp, unk = _clean_map(d), _clean_unknown(d)
    ids = list(names) + [k for k in list(mp) + list(unk) if k not in names]
    out, seen = [], set()
    for appid in ids:
        if appid in seen:
            continue
        seen.add(appid)
        m = mp.get(appid)
        name = names.get(appid) or (m["name"] if m else "") or unk.get(appid, "")
        out.append({"appid": appid, "name": name, "unknown": appid in unk and not m, "mapped": bool(m)})
    out.sort(key=lambda g: (g["name"] == "", g["name"].lower(), int(g["appid"])))
    return {"games": out}


def _status():
    lang = _load().get("lang")
    return {"has_key": bool(_key()), "steam": _steam_root() is not None,
            "lang": lang if lang in LANGS else None}


def _has(appid):
    g = _grid_dir(create=False)
    out = {}
    for kind, spec in KINDS.items():
        base = spec[2].format(appid)
        out[kind] = any((g / (base + "." + e)).exists() for e in EXTS)
    return {"has": out}


# ---- SteamGridDB ----------------------------------------------------------

def _data_list(raw):
    snippet = raw[:100].decode("utf-8", "replace").replace("\n", " ")
    try:
        parsed = json.loads(raw.decode("utf-8", "replace"))
    except ValueError:
        raise _Err("bad_data:not JSON:" + snippet)
    data = parsed.get("data") if isinstance(parsed, dict) else None
    if not isinstance(data, list):
        raise _Err("bad_data:no list:" + snippet)
    return data


def _mark_unknown(appid):
    try:
        name = _manifests().get(appid, "")
    except _Err:
        name = ""

    def mut(d):
        unk = _clean_unknown(d)
        if appid not in unk and len(unk) < 200:
            unk[appid] = name
        d["unknown"] = unk
    _update(mut)


def _list(appid, kind, page):
    key = _key()
    if not key:
        raise _Err("no_key")
    endpoint, extra, _ = KINDS[kind]
    q = dict(extra)
    q["types"] = "static"
    q["page"] = str(page)
    mapped = _clean_map(_load()).get(appid)
    if mapped:
        url = "%s/%s/game/%d?%s" % (API, endpoint, mapped["gid"], urllib.parse.urlencode(q))
    else:
        url = "%s/%s/steam/%s?%s" % (API, endpoint, appid, urllib.parse.urlencode(q))
    try:
        raw = _get(url, {"Authorization": "Bearer " + key, "User-Agent": UA}, MAX_JSON)
    except urllib.error.HTTPError as e:
        if e.code == 404 and not mapped:
            _mark_unknown(appid)        # SteamGridDB does not know this app: list it under "Unknown"
        raise
    data = _data_list(raw)
    items = []
    for i in data:
        if not isinstance(i, dict):
            continue
        url_i = i.get("url")
        thumb = i.get("thumb") or url_i
        if not (isinstance(url_i, str) and _host_ok(url_i) and isinstance(thumb, str) and _host_ok(thumb)):
            continue
        author = i.get("author")
        items.append({
            "id": i.get("id"),
            "url": url_i,
            "thumb": thumb,
            "w": i.get("width"),
            "h": i.get("height"),
            "author": author.get("name") if isinstance(author, dict) else None,
        })
    return {"items": items, "more": len(data) >= 50, "mapped": mapped}


def _search(term):
    """Search SteamGridDB games by name. Falls back to simpler spellings when nothing is found."""
    key = _key()
    if not key:
        raise _Err("no_key")
    t = " ".join(str(term).split())[:80]
    if len(t) < 2:
        raise _Err("bad_arg")
    tries = [t]
    t2 = re.sub(r"[\(\[][^\)\]]*[\)\]]", " ", t)          # drop "(VR)" and "[Demo]"
    t2 = " ".join(re.sub(r"[^\w\s]", " ", t2).split())     # drop punctuation
    if len(t2) >= 2 and t2.lower() != t.lower():
        tries.append(t2)
    words = t2.split()
    if len(words) >= 3 and len(" ".join(words[:2])) >= 2:
        tries.append(" ".join(words[:2]))
    for tr in tries:
        url = "%s/search/autocomplete/%s" % (API, urllib.parse.quote(tr, safe=""))
        try:
            raw = _get(url, {"Authorization": "Bearer " + key, "User-Agent": UA}, MAX_JSON)
        except urllib.error.HTTPError as e:
            if e.code == 404:
                continue
            raise
        res = []
        for g in _data_list(raw)[:15]:
            if isinstance(g, dict) and isinstance(g.get("id"), int) and isinstance(g.get("name"), str):
                res.append({"id": g["id"], "name": g["name"][:80], "verified": g.get("verified") is True})
        if res:
            res.sort(key=lambda x: x["name"].lower() != tr.lower())   # exact match first
            return {"results": res, "term": tr}
    return {"results": [], "term": tries[-1]}


def _assign(appid, gid, name):
    def mut(d):
        mp = _clean_map(d)
        if appid in mp or len(mp) < 500:
            mp[appid] = {"gid": gid, "name": name}
        d["map"] = mp
        unk = _clean_unknown(d)
        unk.pop(appid, None)
        d["unknown"] = unk
    _update(mut)
    return {"ok": True}


def _forget(appid):
    def mut(d):
        mp, unk = _clean_map(d), _clean_unknown(d)
        mp.pop(appid, None)
        unk.pop(appid, None)
        d["map"], d["unknown"] = mp, unk
    _update(mut)
    return {"ok": True}


def _apply(appid, kind, url):
    grid = _grid_dir()
    ext, data = _image(_get(url, {"User-Agent": UA}, MAX_IMG))
    if ext not in ("png", "jpg"):
        raise _Err("bad_image")
    base = KINDS[kind][2].format(appid)
    tmp = grid / (".framey-" + base + ".tmp")
    tmp.write_bytes(data)
    for e in EXTS:
        if e != ext:
            try:
                (grid / (base + "." + e)).unlink()
            except FileNotFoundError:
                pass
    os.replace(str(tmp), str(grid / (base + "." + ext)))
    return {"ok": True}


def _reset(appid, kind):
    grid = _grid_dir(create=False)
    base = KINDS[kind][2].format(appid)
    for e in EXTS:
        try:
            (grid / (base + "." + e)).unlink()
        except FileNotFoundError:
            pass
    return {"ok": True}


def _fetch(url):
    """Image as base64 for Steam's own set-artwork call (instant refresh, no file written here)."""
    ext, data = _image(_get(url, {"User-Agent": UA}, MAX_LIVE))
    if ext not in ("png", "jpg"):
        raise _Err("bad_image")
    return {"data": base64.b64encode(data).decode("ascii"), "ext": ext}


# ---- instant refresh through Steam's own page ------------------------------
# The Framey panel lives in SteamVR's page, which has no SteamClient.Apps. Steam's main page
# ("SharedJSContext") does, and it is reachable on the local debug port. We talk to it with a
# minimal WebSocket client (standard library only) and call the same function Decky uses.
WS_GUID = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11"
CDP_PORTS = range(8080, 8091)
CHUNK = 3 * 131072          # raw bytes per message (524288 base64 characters)
STEAM_TYPE = {"grid_p": 0, "hero": 1, "logo": 2, "grid_w": 3, "icon": 4}
EXPR_SET = ('(async()=>{try{const a=window.SteamClient&&window.SteamClient.Apps;'
            'if(!a||typeof a.SetCustomArtworkForApp!=="function")return "missing";'
            'try{if(typeof a.ClearCustomArtworkForApp==="function")await a.ClearCustomArtworkForApp(%d,%d)}catch(e){}'
            'await a.SetCustomArtworkForApp(%d,window.__fyArt,"%s",%d);return "ok"}'
            'catch(e){return "error:"+String(e&&e.message||e)}})()')
EXPR_CLEAR = ('(async()=>{try{const a=window.SteamClient&&window.SteamClient.Apps;'
              'if(!a||typeof a.ClearCustomArtworkForApp!=="function")return "missing";'
              'await a.ClearCustomArtworkForApp(%d,%d);return "ok"}'
              'catch(e){return "error:"+String(e&&e.message||e)}})()')
EXPR_PROBE = ('JSON.stringify((function(){var a=window.SteamClient&&window.SteamClient.Apps;'
              'return {apps:typeof a,set:typeof (a&&a.SetCustomArtworkForApp),'
              'clear:typeof (a&&a.ClearCustomArtworkForApp),href:String(location.href).slice(0,100)}})())')


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


def _eval(ws, n, expr):
    ws.send(json.dumps({"id": n, "method": "Runtime.evaluate",
                        "params": {"expression": expr, "awaitPromise": True, "returnByValue": True}}))
    end = time.time() + 25
    while time.time() < end:
        msg = json.loads(ws.recv().decode("utf-8", "replace"))
        if msg.get("id") == n:
            res = msg.get("result") or {}
            if msg.get("error") or res.get("exceptionDetails"):
                raise _Err("cdp_exception")
            return (res.get("result") or {}).get("value")
    raise _Err("timeout")


def _verdict(res):
    if res == "ok":
        return
    if res == "missing":
        raise _Err("api_missing")
    raise _Err("cdp:" + str(res)[:80])


def _cdp_apply(appid, kind, url):
    ext, data = _image(_get(url, {"User-Agent": UA}, MAX_IMG))
    if ext not in ("png", "jpg"):
        raise _Err("bad_image")
    port, path = _cdp_target()
    ws = _WS(port, path)
    n = 1
    try:
        _eval(ws, n, 'window.__fyArt=""')
        for i in range(0, len(data), CHUNK):
            n += 1
            b64 = base64.b64encode(data[i:i + CHUNK]).decode("ascii")
            _eval(ws, n, '(window.__fyArt+="%s"),0' % b64)
        n += 1
        res = _eval(ws, n, EXPR_SET % (int(appid), STEAM_TYPE[kind], int(appid), ext, STEAM_TYPE[kind]))
    finally:
        try:
            _eval(ws, n + 1, "delete window.__fyArt,0")
        except Exception:
            pass
        ws.close()
    _verdict(res)
    return {"ok": True}


def _cdp_reset(appid, kind):
    port, path = _cdp_target()
    ws = _WS(port, path)
    try:
        res = _eval(ws, 1, EXPR_CLEAR % (int(appid), STEAM_TYPE[kind]))
    finally:
        ws.close()
    _verdict(res)
    return {"ok": True}


def _cdp_probe():
    port, path = _cdp_target()
    ws = _WS(port, path)
    try:
        res = _eval(ws, 1, EXPR_PROBE)
    finally:
        ws.close()
    out = json.loads(res)
    out["port"] = port
    return out


def _targets():
    """Pages Steam offers on local debug ports (diagnostics only)."""
    op = urllib.request.build_opener(urllib.request.ProxyHandler({}))
    ports, out = [], []
    for port in range(8080, 8091):
        try:
            with op.open("http://127.0.0.1:%d/json/list" % port, timeout=1) as r:
                data = json.loads(r.read(300000).decode("utf-8", "replace"))
        except Exception:
            continue
        ports.append(port)
        for t in data if isinstance(data, list) else []:
            if isinstance(t, dict):
                out.append({"port": port, "title": str(t.get("title", ""))[:60],
                            "url": str(t.get("url", ""))[:100], "ws": bool(t.get("webSocketDebuggerUrl"))})
    return {"ports": ports, "targets": out[:40]}


def _thumb(url):
    ext, data = _image(_get(url, {"User-Agent": UA}, MAX_THUMB))
    if ext is None:
        raise _Err("bad_image")
    mime = "jpeg" if ext == "jpg" else ext
    return {"data": "data:image/%s;base64,%s" % (mime, base64.b64encode(data).decode("ascii"))}


# ---- entry point ----------------------------------------------------------

def _target(arg):
    if not isinstance(arg, dict):
        raise _Err("bad_arg")
    appid = str(arg.get("appid", ""))
    if not re.fullmatch(r"[0-9]{1,10}", appid):
        raise _Err("bad_appid")
    kind = arg.get("kind")
    if kind not in KINDS:
        raise _Err("bad_kind")
    return appid, kind


async def call(method, arg):
    try:
        if method == "status":
            return await _run(_status)
        if method == "games":
            return await _run(_games)
        if method == "set_key":
            return await _run(_save_key, arg.get("key") if isinstance(arg, dict) else None)
        if method == "set_lang":
            return await _run(_set_lang, arg.get("lang") if isinstance(arg, dict) else None)
        if method == "has":
            if not isinstance(arg, dict) or not re.fullmatch(r"[0-9]{1,10}", str(arg.get("appid", ""))):
                raise _Err("bad_appid")
            return await _run(_has, str(arg["appid"]))
        if method == "list":
            appid, kind = _target(arg)
            page = arg.get("page", 0)
            page = page if isinstance(page, int) and 0 <= page < 100 else 0
            return await _run(_list, appid, kind, page)
        if method == "search":
            term = arg.get("term") if isinstance(arg, dict) else None
            if not isinstance(term, str):
                raise _Err("bad_arg")
            return await _run(_search, term)
        if method in ("assign", "forget"):
            if not isinstance(arg, dict) or not re.fullmatch(r"[0-9]{1,10}", str(arg.get("appid", ""))):
                raise _Err("bad_appid")
            appid = str(arg["appid"])
            if method == "forget":
                return await _run(_forget, appid)
            gid, name = arg.get("gid"), arg.get("name")
            if not (isinstance(gid, int) and not isinstance(gid, bool) and 0 < gid < 10 ** 9 and isinstance(name, str)):
                raise _Err("bad_arg")
            return await _run(_assign, appid, gid, name[:80])
        if method == "apply":
            appid, kind = _target(arg)
            url = arg.get("url")
            if not (isinstance(url, str) and _host_ok(url)):
                raise _Err("bad_url")
            return await _run(_apply, appid, kind, url)
        if method == "cdp_apply":
            appid, kind = _target(arg)
            url = arg.get("url")
            if not (isinstance(url, str) and _host_ok(url)):
                raise _Err("bad_url")
            return await _run(_cdp_apply, appid, kind, url)
        if method == "cdp_reset":
            appid, kind = _target(arg)
            return await _run(_cdp_reset, appid, kind)
        if method == "cdp_probe":
            return await _run(_cdp_probe)
        if method == "targets":
            return await _run(_targets)
        if method == "fetch":
            url = arg.get("url") if isinstance(arg, dict) else None
            if not (isinstance(url, str) and _host_ok(url)):
                raise _Err("bad_url")
            return await _run(_fetch, url)
        if method == "reset":
            appid, kind = _target(arg)
            return await _run(_reset, appid, kind)
        if method == "thumb":
            url = arg.get("url") if isinstance(arg, dict) else None
            if not (isinstance(url, str) and _host_ok(url)):
                raise _Err("bad_url")
            return await _run(_thumb, url)
        return {"error": "unknown_method"}
    except _Err as e:
        return {"error": e.code}
    except urllib.error.HTTPError as e:
        if e.code in (401, 403):
            return {"error": "bad_key"}
        if e.code == 404:
            return {"error": "not_found"}
        return {"error": "http_%d" % e.code}
    except asyncio.TimeoutError:
        return {"error": "timeout"}
    except urllib.error.URLError:
        return {"error": "network"}
    except OSError:
        return {"error": "io"}
    except ValueError as e:
        return {"error": "bad_data:%s:%s" % (method, str(e)[:60])}
