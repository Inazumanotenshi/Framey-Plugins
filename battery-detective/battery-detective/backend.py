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
LANGS = ("de", "en", "fr", "es", "it", "pt", "nl", "pl", "sv", "ru", "uk", "tr", "ja", "ko", "zh")
GEN_ATTR = "_framey_battery_detective_gen"
RE_APP = re.compile(r"SteamLaunch\s+AppId=([0-9]+)")
SKIP = re.compile(r"^(Proton|Steam Linux Runtime|Steamworks Common)", re.I)

MY_GEN = getattr(sys, GEN_ATTR, 0) + 1
setattr(sys, GEN_ATTR, MY_GEN)

_S = {"data": None, "last": None, "cur": None, "hist": [], "dirty": False,
      "saved": 0.0, "task": None, "lock": None, "lim": None, "lim_err": None, "inhibited": False}
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
    # health = what the battery holds now compared with what it held when new
    health = None
    ed, cd = _num(d / "energy_full_design"), _num(d / "charge_full_design")
    if ef and ed:
        health = ef / ed * 100.0
    elif cd:
        cf = _num(d / "charge_full")
        health = cf / cd * 100.0 if cf else None
    if health is not None and not 20 <= health <= 130:   # firmware junk
        health = None
    cycles = _num(d / "cycle_count")
    return {"name": d.name, "pct": pct, "status": _rd(d / "status") or "Unknown", "watts": watts,
            "wh": wh, "wh_full": wh_full, "temp": temp / 10.0 if temp is not None else None,
            "health": min(health, 100.0) if health is not None else None,
            "cycles": int(cycles) if cycles is not None and cycles > 0 else None}


def _battery(want):
    supplies = _supplies()
    d = _pick(supplies, want)
    return (_reading(d) if d else None), [s.name for s in supplies]


# ---- charge limit ("Battery Save") -----------------------------------------
# Two kernel interfaces exist. charge_control_end_threshold makes the charger itself stop
# at N % (works even while Framey is closed, but often resets on reboot, so we re-apply it).
# charge_behaviour can only pause charging, so the plugin flips it while it is running.
# Both usually need root; without write access we fall back to a reminder in the UI.

THR = "charge_control_end_threshold"
BEH = "charge_behaviour"


def _beh_state(d):
    txt = _rd(d / BEH)
    if not txt:
        return None, []
    opts = txt.replace("[", "").replace("]", "").split()
    m = re.search(r"\[([^\]]+)\]", txt)
    return (m.group(1) if m else (opts[0] if len(opts) == 1 else None)), opts


def _limit_info(d):
    if d is None:
        return {"mode": "none", "thr": None}
    t, b = d / THR, d / BEH
    thr = _num(t) if t.exists() else None
    if t.exists() and os.access(str(t), os.W_OK):
        return {"mode": "hw", "thr": thr}
    cur, opts = _beh_state(d) if b.exists() else (None, [])
    if "inhibit-charge" in opts and os.access(str(b), os.W_OK):
        return {"mode": "soft", "thr": thr, "beh": cur}
    if t.exists() or "inhibit-charge" in opts:
        return {"mode": "ro", "thr": thr}
    return {"mode": "none", "thr": None}


def _wr(p, val):
    with open(str(p), "w") as f:
        f.write(str(val))


def _enforce(want, limit):
    """Runs in a worker thread every tick. Returns (limit info, error code or None)."""
    d = _pick(_supplies(), want)
    info = _limit_info(d)
    if d is None:
        return info, None
    try:
        if info["mode"] == "hw":
            # without a limit of our own we never touch it (SteamOS may manage it itself)
            if limit and (info["thr"] is None or int(info["thr"]) != limit):
                _wr(d / THR, limit)
                info["thr"] = limit
        elif info["mode"] == "soft":
            pct = _num(d / "capacity")
            beh = info.get("beh")
            if limit and pct is not None and pct >= limit and beh != "inhibit-charge":
                _wr(d / BEH, "inhibit-charge")
                _S["inhibited"] = True
            elif beh == "inhibit-charge" and _S["inhibited"] and (not limit or (pct is not None and pct <= limit - 3)):
                _wr(d / BEH, "auto")          # only undo what we set ourselves
                _S["inhibited"] = False
    except OSError:
        return info, "write"
    return info, None


def _release(want):
    """Limit switched off: give the charger back its full range once."""
    d = _pick(_supplies(), want)
    info = _limit_info(d)
    if d is None:
        return
    if info["mode"] == "hw" and info["thr"] is not None and int(info["thr"]) < 100:
        _wr(d / THR, 100)
    elif info["mode"] == "soft" and _S["inhibited"]:
        _wr(d / BEH, "auto")
        _S["inhibited"] = False


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

def _rec():
    return _S["data"].get("rec") is not False


def _limit():
    v = _S["data"].get("limit")
    return v if isinstance(v, int) and 50 <= v <= 95 else None


def _apply(rd, app, now, rec=True):
    S = _S
    if rd is None:
        S["last"] = None
        return
    S["last"] = dict(rd, t=now)
    key = app or "idle"
    disch = rd["status"] == "Discharging"
    if not rec:                 # paused: live readout keeps going, per-game stats do not
        S["cur"] = None
        S["hist"].append({"t": now, "pct": rd["pct"], "w": rd["watts"], "d": 1 if disch else 0})
        del S["hist"][:-HIST_MAX]
        return
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
    want = want if isinstance(want, str) else None
    rd, app = await _thread(_probe, want)
    _apply(rd, app, time.time(), _rec())
    _S["lim"], _S["lim_err"] = await _thread(_enforce, want, _limit())
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
    lim = _S["lim"]
    if lim is None:
        lim = await _thread(lambda: _limit_info(_pick(_supplies(), want if isinstance(want, str) else None)))
    limit = _limit()
    works = lim["mode"] in ("hw", "soft") and not _S["lim_err"]
    hit = bool(limit and rd and rd["pct"] is not None and rd["pct"] >= limit
               and rd["status"] in ("Charging", "Full") and not works)
    return {"battery": rd, "devices": devices, "device": rd["name"] if rd else None,
            "auto": not isinstance(want, str) or want not in devices,
            "game": game, "eta": _eta(rd, cur["key"] if cur else "idle"),
            "hist": [[h["t"], h["pct"], h["w"], h["d"]] for h in _S["hist"]],
            "lang": lang if lang in LANGS else None,
            "rec": _rec(), "limit": limit, "lim_mode": lim["mode"], "lim_err": _S["lim_err"],
            "limit_hit": hit}


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
        extra = []
        for f in (THR, BEH, "charge_control_start_threshold", "cycle_count", "energy_full_design", "charge_full_design"):
            p = d / f
            if p.exists():
                extra.append("%s = %s%s" % (f, _rd(p), "" if os.access(str(p), os.W_OK) else "  (read-only)"))
        if extra:
            txt += "\n--\n" + "\n".join(extra)
        items.append({"name": d.name, "text": txt[:2000]})
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
        if method == "set_rec":
            on = arg.get("on") if isinstance(arg, dict) else None
            if not isinstance(on, bool):
                raise _Err("bad_arg")
            _S["data"]["rec"] = on
            _S["cur"] = None          # resume starts a fresh session instead of bridging the pause
            await _save()
            return {"ok": True, "rec": on}
        if method == "set_limit":
            v = arg.get("limit") if isinstance(arg, dict) else None
            if v == 0:
                _S["data"].pop("limit", None)
            elif isinstance(v, int) and 50 <= v <= 95:
                _S["data"]["limit"] = v
            else:
                raise _Err("bad_arg")
            await _save()
            want = _S["data"].get("device")
            want = want if isinstance(want, str) else None
            try:
                if v == 0:
                    await _thread(_release, want)
                    _S["lim_err"] = None
                    _S["lim"] = await _thread(lambda: _limit_info(_pick(_supplies(), want)))
                else:
                    _S["lim"], _S["lim_err"] = await _thread(_enforce, want, v)
            except OSError:
                _S["lim_err"] = "write"
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
