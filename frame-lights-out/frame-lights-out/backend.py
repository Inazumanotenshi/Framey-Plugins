"""Status Light: keeps the Steam Frame's side status LED dark while switched off.

The LED is /sys/class/leds/rgb:status, writable by the `leds` group (the steamos
user is a member), so no root is needed. Valve's `ledcontrol` daemon sets the
colour whenever power or VR state changes; while the light is switched off this
backend watches the LED and puts it back to 0 each time that happens.
"""
import asyncio, ctypes, json, os, pathlib, sys

LED = pathlib.Path("/sys/class/leds/rgb:status")
VR_STATE = pathlib.Path("/run/deckardcharger/vr_state")
CONF = pathlib.Path.home() / ".config/frame-lights-out/state.json"
IN_MODIFY, IN_ATTRIB, IN_CREATE, IN_NONBLOCK, IN_CLOEXEC = 0x2, 0x4, 0x100, 0o4000, 0o2000000

_off = False
_wake = None


def _log(*a):
    print("frame-lights-out:", *a, file=sys.stderr, flush=True)


def _load():
    try:
        return bool(json.loads(CONF.read_text()).get("off"))
    except Exception:
        return False


def _save():
    try:
        CONF.parent.mkdir(parents=True, exist_ok=True)
        tmp = CONF.with_name(CONF.name + ".tmp")
        tmp.write_text(json.dumps({"off": _off}))
        os.replace(tmp, CONF)
    except OSError as e:
        _log("could not save state:", e)


def _lit():
    try:
        if "[none]" not in (LED / "trigger").read_text():
            return True
        return (LED / "brightness").read_text().strip() != "0"
    except OSError:
        return False


def _dark():
    """Turn the LED off. Writing 0 also drops any blink/throb trigger."""
    if not _lit():
        return None
    try:
        (LED / "brightness").write_text("0")
        return None
    except OSError as e:
        return str(e)


async def _restore():
    """Hand the LED back to ledcontrol by making it re-evaluate its state.

    ledcontrol only repaints on a change, so vr_state (owned by steamos) is
    flipped to a different value and straight back.
    """
    try:
        cur = VR_STATE.read_text()
        VR_STATE.write_text(cur.strip() + "~")
        await asyncio.sleep(0.15)
        VR_STATE.write_text(cur)
        await asyncio.sleep(0.25)
        if _lit():
            return
    except OSError as e:
        _log("vr_state nudge failed:", e)
    try:  # fallback: the stock "headset on" look, dim white
        (LED / "multi_intensity").write_text("255 255 255")
        (LED / "brightness").write_text("25")
    except OSError as e:
        _log("could not relight:", e)


async def _guard():
    me = sys.modules.get(__name__)
    loop = asyncio.get_running_loop()
    ev = asyncio.Event()
    global _wake
    _wake = ev
    fd = -1
    try:
        libc = ctypes.CDLL(None, use_errno=True)
        fd = libc.inotify_init1(IN_NONBLOCK | IN_CLOEXEC)
        if fd >= 0 and libc.inotify_add_watch(fd, os.fsencode(LED), IN_MODIFY | IN_ATTRIB | IN_CREATE) >= 0:
            loop.add_reader(fd, ev.set)
        else:
            _log("inotify unavailable, polling only")
    except Exception as e:
        _log("inotify unavailable, polling only:", e)
    try:
        while sys.modules.get(__name__) is me:
            if _off:
                err = _dark()
                if err:
                    _log("could not turn LED off:", err)
            try:
                await asyncio.wait_for(ev.wait(), 2)
            except asyncio.TimeoutError:
                pass
            ev.clear()
            if fd >= 0:
                try:
                    os.read(fd, 4096)
                except OSError:
                    pass
        # Framey has no unload hook: getting here means this copy was replaced
        # (reload) or the plugin was disabled/removed. Only then relight.
        if _off and sys.modules.get(__name__) is None:
            await _restore()
    finally:
        if fd >= 0:
            try:
                loop.remove_reader(fd)
            except Exception:
                pass
            os.close(fd)


async def call(method, arg):
    global _off
    if method in ("set", "toggle"):
        want_light = _off if method == "toggle" else bool(arg)
        _off = not want_light
        _save()
        if _off:
            err = _dark()
            if err:
                return {"error": "LED not writable: " + err, "light": True}
        else:
            await _restore()
        if _wake:
            _wake.set()
    elif method != "get":
        return {"error": "unknown method"}
    return {"light": not _off, "available": LED.exists()}


_off = _load()
try:
    _task = asyncio.get_running_loop().create_task(_guard())
except RuntimeError:
    _task = None
