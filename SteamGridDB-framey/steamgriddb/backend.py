"""SteamGridDB for Framey: pick artwork from SteamGridDB, write it into Steam's grid folder.

Runs inside the Framey loader's single event loop: nothing here may block the loop,
and only the standard library is used. Network and disk work runs in worker threads
with timeouts and size caps.
"""
import asyncio
import base64
import json
import os
import re
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
    "icon": ("icons", {"mimes": RASTER}, "{}_icon"),
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


def _key():
    k = _load().get("api_key")
    return k if isinstance(k, str) else ""


def _save_key(k):
    k = k.strip() if isinstance(k, str) else ""
    if not re.fullmatch(r"[0-9A-Za-z]{16,64}", k):
        raise _Err("bad_key_format")
    d = _load()
    d["api_key"] = k
    _write(d)
    return {"ok": True}


def _set_lang(code):
    if code not in LANGS:
        raise _Err("bad_arg")
    d = _load()
    d["lang"] = code
    _write(d)
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


def _games():
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
    out, ids = [], set()
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
            if not a or not n or a.group(1) in ids or SKIP.match(n.group(1)):
                continue
            ids.add(a.group(1))
            out.append({"appid": a.group(1), "name": n.group(1)})
    out.sort(key=lambda g: g["name"].lower())
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

def _list(appid, kind, page):
    key = _key()
    if not key:
        raise _Err("no_key")
    endpoint, extra, _ = KINDS[kind]
    q = dict(extra)
    q["types"] = "static"
    q["page"] = str(page)
    url = "%s/%s/steam/%s?%s" % (API, endpoint, appid, urllib.parse.urlencode(q))
    raw = _get(url, {"Authorization": "Bearer " + key, "User-Agent": UA}, MAX_JSON)
    data = json.loads(raw.decode("utf-8", "replace")).get("data")
    if not isinstance(data, list):
        raise _Err("bad_data")
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
    return {"items": items, "more": len(data) >= 50}


def _apply(appid, kind, url):
    grid = _grid_dir()
    data = _get(url, {"User-Agent": UA}, MAX_IMG)
    ext = _sniff(data)
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
    data = _get(url, {"User-Agent": UA}, MAX_LIVE)
    ext = _sniff(data)
    if ext not in ("png", "jpg"):
        raise _Err("bad_image")
    return {"data": base64.b64encode(data).decode("ascii"), "ext": ext}


def _thumb(url):
    data = _get(url, {"User-Agent": UA}, MAX_THUMB)
    ext = _sniff(data)
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
        if method == "apply":
            appid, kind = _target(arg)
            url = arg.get("url")
            if not (isinstance(url, str) and _host_ok(url)):
                raise _Err("bad_url")
            return await _run(_apply, appid, kind, url)
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
    except ValueError:
        return {"error": "bad_data"}
