"""Battery Detective for Framey: measures battery drain per game.

Runs inside the Framey loader's single event loop, so nothing here blocks it: all
file work happens in worker threads, and only the standard library is used.

A background task samples the battery every INTERVAL seconds and attributes the drain
to the running Steam game (found via the `reaper SteamLaunch AppId=...` process).
Framey has no unload hook, so every import of this module gets a generation number and
older tasks stop themselves once a newer module has been imported.
"""
import asyncio
import json
import os
import re
import sys
import time
from pathlib import Path

PS = Path("/sys/class/power_supply")
CONF = Path.home() / ".config" / "framey" / "battery-detective.json"
INTERVAL = 30        # seconds between samples
SAVE_EVERY = 60      # seconds between disk writes (only when something changed)
HIST_MAX = 120       # samples kept for the live chart (one hour)
MIN_SEC = 300        # seconds of drain data before a game's numbers count as reliable
LANGS = ("de", "en", "fr", "es", "it", "pt")
GEN_ATTR = "_framey_battery_detective_gen"
RE_APP = re.compile(r"SteamLaunch\s+AppId=([0-9]+)")
SKIP = re.compile(r"^(Proton|Steam Linux Runtime|Steamworks Common)", re.I)

MY_GEN = getattr(sys, GEN_ATTR, 0) + 1
setattr(sys, GEN_ATTR, MY_GEN)

_S = {"data": None, "last": None, "cur": None, "hist": [], "dirty": False,
      "saved": 0.0, "task": None, "lock": None}
_NAMES = {}
_NAMES_T = 0.0


class _Err(Exception):
    def __init__(self, code):
        Exception.__init__(self, code)
        self.code = code


async def _thread(fn, *args):
    return await asyncio.wait_for(asyncio.get_running_loop().run_in_executor(None, fn, *args), 20)


# ---- sysfs ----------------------------------------------------------------

def _rd(p):
    try:
        return p.read_text().strip()
    except (OSError, ValueError):
        return None


def _num(p):
    try:
        return float(_rd(p))
    except (TypeError, ValueError):
        return None


def _supplies():
    try:
        dirs = sorted(PS.iterdir())
    except OSError:
        return []
    return [d for d in dirs if _rd(d / "type") == "Battery"]


def _pick(supplies, want):
    for d in supplies:
        if d.name == want:
            return d
    for d in supplies:          # prefer the system battery over controller batteries
        if _rd(d / "scope") != "Device":
            return d
    return supplies[0] if supplies else None


def _reading(d):
    pct = _num(d / "capacity")
    volts = _num(d / "voltage_now")
    power = _num(d / "power_now")
    cur = _num(d / "current_now")
    if power is not None:
        watts = abs(power) / 1e6
    elif cur is not None and volts is not None:
        watts = abs(cur) * volts / 1e12
    else:
        watts = None
    if watts == 0:
        watts = None
    en, ef = _num(d / "energy_now"), _num(d / "energy_full")
    if en is not None:
        wh, wh_full = en / 1e6, (ef / 1e6 if ef else None)
    else:
        cn, cf = _num(d / "charge_now"), _num(d / "charge_full")
        vd = _num(d / "voltage_min_design") or volts
        wh = cn * vd / 1e12 if cn is not None and vd else None
        wh_full = cf * vd / 1e12 if cf and vd else None
    if pct is None and wh and wh_full:
        pct = wh / wh_full * 100.0
    temp = _num(d / "temp")
    return {"name": d.name, "pct": pct, "status": _rd(d / "status") or "Unknown", "watts": watts,
            "wh": wh, "wh_full": wh_full, "temp": temp / 10.0 if temp is not None else None}


def _battery(want):
    supplies = _supplies()
    d = _pick(supplies, want)
    return (_reading(d) if d else None), [s.name for s in supplies]


# ---- Steam ----------------------------------------------------------------

def _steam_root():
    home = Path.home()
    for rel in (".local/share/Steam", ".steam/steam", ".steam/root"):
        r = home / rel
        if (r / "steamapps").is_dir() or (r / "userdata").is_dir():
            return r.resolve()
    return None


def _scan_names():
    root = _steam_root()
    names = {}
    if root is None:
        return names
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
    for lib in libs:
        try:
            files = list((lib / "steamapps").glob("appmanifest_*.acf"))
        except OSError:
            continue
        for f in files:
            try:
                t = f.read_text(errors="replace")
            except OSError:
                continue
            a = re.search(r'"appid"\s+"([0-9]+)"', t)
            n = re.search(r'"name"\s+"([^"]*)"', t)
            if a and n and not SKIP.match(n.group(1)):
                names[a.group(1)] = n.group(1)
    return names


def _running():
    try:
        pids = [p for p in os.listdir("/proc") if p.isdigit()]
    except OSError:
        return None
    for pid in pids:
        try:
            with open("/proc/%s/cmdline" % pid, "rb") as f:
                raw = f.read(4096)
        except OSError:
            continue
        if b"SteamLaunch" not in raw:
            continue
        m = RE_APP.search(raw.replace(b"\0", b" ").decode("utf-8", "replace"))
        if m and m.group(1) != "0":
            return m.group(1)
    return None


def _probe(want):
    global _NAMES, _NAMES_T
    rd, _ = _battery(want)
    app = _running()
    if app and app not in _NAMES and time.time() - _NAMES_T > 120:
        _NAMES = _scan_names()
        _NAMES_T = time.time()
    return rd, app


def _name(key):
    if key == "idle":
        return ""
    return _NAMES.get(key) or ("App " + key)


# ---- stored data ----------------------------------------------------------

def _load():
    try:
        d = json.loads(CONF.read_text())
    except (OSError, ValueError):
        d = {}
    if not isinstance(d, dict):
        d = {}
    g = d.get("games")
    d["games"] = {k: v for k, v in g.items()
                  if isinstance(v, dict) and re.fullmatch(r"[0-9]{1,10}|idle", str(k))} if isinstance(g, dict) else {}
    return d


def _write(text):
    CONF.parent.mkdir(parents=True, exist_ok=True)
    tmp = CONF.with_suffix(".tmp")
    tmp.write_text(text)
    os.replace(str(tmp), str(CONF))


async def _ensure_data():
    if _S["data"] is None:
        loaded = await _thread(_load)
        if _S["data"] is None:
            _S["data"] = loaded


async def _save():
    if _S["lock"] is None:
        _S["lock"] = asyncio.Lock()
    async with _S["lock"]:
        text = json.dumps(_S["data"])
        await _thread(_write, text)
        _S["dirty"] = False
        _S["saved"] = time.time()


def _game(key):
    g = _S["data"]["games"].setdefault(key, {})
    for f in ("sec", "pct", "wh", "wsec"):
        if not isinstance(g.get(f), (int, float)):
            g[f] = 0.0
    if not isinstance(g.get("n"), int):
        g["n"] = 0
    return g


# ---- tracking -------------------------------------------------------------

def _apply(rd, app, now):
    S = _S
    if rd is None:
        S["last"] = None
        return
    S["last"] = dict(rd, t=now)
    key = app or "idle"
    disch = rd["status"] == "Discharging"
    cur = S["cur"]
    if cur is None or cur["key"] != key:
        g = _game(key)
        g["n"] += 1
        g["last"] = now
        if key != "idle":
            g["name"] = _name(key)
        S["cur"] = {"key": key, "t0": now, "prev_t": now, "prev_pct": rd["pct"], "sec": 0.0, "drop": 0.0}
        S["dirty"] = True
    else:
        dt = now - cur["prev_t"]
        if 0 < dt <= INTERVAL * 4:   # longer gaps mean sleep or a stalled loader: do not count them
            if disch:
                g = _game(key)
                g["sec"] += dt
                cur["sec"] += dt
                if rd["pct"] is not None and cur["prev_pct"] is not None and rd["pct"] < cur["prev_pct"]:
                    g["pct"] += cur["prev_pct"] - rd["pct"]
                    cur["drop"] += cur["prev_pct"] - rd["pct"]
                if rd["watts"] is not None:
                    g["wh"] += rd["watts"] * dt / 3600.0
                    g["wsec"] += dt
                g["last"] = now
                S["dirty"] = True
        cur["prev_t"] = now
        cur["prev_pct"] = rd["pct"]
    hist = S["hist"]
    hist.append({"t": now, "pct": rd["pct"], "w": rd["watts"], "d": 1 if disch else 0})
    del hist[:-HIST_MAX]


async def _tick():
    await _ensure_data()
    want = _S["data"].get("device")
    rd, app = await _thread(_probe, want if isinstance(want, str) else None)
    _apply(rd, app, time.time())
    if _S["dirty"] and time.time() - _S["saved"] >= SAVE_EVERY:
        await _save()


async def _loop():
    while getattr(sys, GEN_ATTR, None) == MY_GEN:
        try:
            await _tick()
        except Exception:
            pass
        await asyncio.sleep(INTERVAL)


def _ensure_task():
    t = _S["task"]
    if t is not None and not t.done():
        return
    try:
        _S["task"] = asyncio.get_running_loop().create_task(_loop())
    except RuntimeError:
        _S["task"] = None


def _rate(g):
    if g["sec"] >= MIN_SEC and g["pct"] >= 1:
        return g["pct"] / (g["sec"] / 3600.0)
    return None


def _eta(rd, key):
    if rd is None or rd["status"] != "Discharging" or not rd["pct"]:
        return None
    ws = [h["w"] for h in _S["hist"][-10:] if h["d"] and h["w"]]
    if rd["wh"] and len(ws) >= 3:
        return {"h": rd["wh"] / (sum(ws) / len(ws)), "src": "live"}
    g = _S["data"]["games"].get(key)
    if g:
        r = _rate(_game(key))
        if r:
            return {"h": rd["pct"] / r, "src": "history"}
    return None


async def _snapshot():
    want = _S["data"].get("device")
    rd, devices = await _thread(_battery, want if isinstance(want, str) else None)
    cur = _S["cur"]
    now = time.time()
    game = None
    if cur and cur["key"] != "idle":
        game = {"key": cur["key"], "name": _name(cur["key"]), "sec": now - cur["t0"], "drop": cur["drop"]}
    lang = _S["data"].get("lang")
    return {"battery": rd, "devices": devices, "device": rd["name"] if rd else None,
            "auto": not isinstance(want, str) or want not in devices,
            "game": game, "eta": _eta(rd, cur["key"] if cur else "idle"),
            "hist": [[h["t"], h["pct"], h["w"], h["d"]] for h in _S["hist"]],
            "lang": lang if lang in LANGS else None}


def _stats():
    out = []
    for key in list(_S["data"]["games"]):
        g = _game(key)
        rate = _rate(g)
        avg_w = g["wh"] / (g["wsec"] / 3600.0) if g["wsec"] >= 60 and g["wh"] > 0 else None
        rd = _S["last"]
        full_wh = rd["wh_full"] if rd and rd.get("wh_full") else None
        full_h = (full_wh / avg_w) if (avg_w and full_wh) else (100.0 / rate if rate else None)
        out.append({"key": key, "name": g.get("name") or _name(key), "sec": g["sec"], "n": g["n"],
                    "rate": rate, "avg_w": avg_w, "full_h": full_h, "reliable": rate is not None})
    out.sort(key=lambda x: (not x["reliable"], -(x["rate"] or 0), -x["sec"]))
    return {"stats": out}


def _diag():
    items = []
    for d in _supplies():
        txt = _rd(d / "uevent") or ""
        items.append({"name": d.name, "text": txt[:1500]})
    return items


# ---- entry point ----------------------------------------------------------

async def call(method, arg):
    try:
        _ensure_task()
        await _ensure_data()
        if method == "snapshot":
            return await _snapshot()
        if method == "stats":
            return _stats()
        if method == "diag":
            return {"items": await _thread(_diag), "running": await _thread(_running)}
        if method == "set_lang":
            code = arg.get("lang") if isinstance(arg, dict) else None
            if code not in LANGS:
                raise _Err("bad_arg")
            _S["data"]["lang"] = code
            await _save()
            return {"ok": True}
        if method == "set_device":
            name = arg.get("device") if isinstance(arg, dict) else None
            if name == "":
                _S["data"].pop("device", None)
            elif isinstance(name, str) and name in [s.name for s in _supplies()]:
                _S["data"]["device"] = name
            else:
                raise _Err("bad_arg")
            _S["cur"] = None
            await _save()
            return {"ok": True}
        if method == "reset":
            _S["data"]["games"] = {}
            _S["cur"] = None
            _S["hist"] = []
            await _save()
            return {"ok": True}
        return {"error": "unknown_method"}
    except _Err as e:
        return {"error": e.code}
    except asyncio.TimeoutError:
        return {"error": "timeout"}
    except OSError:
        return {"error": "io"}


try:                      # start sampling right away when the loader imports us inside its loop
    _ensure_task()
except Exception:
    pass
