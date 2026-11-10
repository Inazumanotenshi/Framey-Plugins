# Launch Arguments for Framey (unofficial!)

Tap together Steam launch options on your **Steam Frame** instead of typing them with the on-screen keyboard. Pick a game, switch building blocks like `WINEDLLOVERRIDES`, `SteamAppId` or `--osc=…` on and off, check the preview and apply it straight to Steam.

## 📸 Features

* 🧩 **Building blocks to tap:** Common launch options grouped by topic, switched on and off per game
* 🔌 **DLL overrides made easy:** Pick `winhttp` (BepInEx), `version` (MelonLoader), `dinput8`, `dxgi`, `d3d11` or `winmm`. They are combined into one `WINEDLLOVERRIDES="…=n,b"` automatically
* 📍 **`%command%` handled for you:** Variables go in front of `%command%`, arguments behind it. No more broken launch lines
* ⭐ **Own building blocks:** Save your own ones once and use them in every game
* 🔍 **Keeps what it doesn't know:** Unknown parts of existing launch options stay untouched and are listed separately, ready to remove (✕) or save as a building block (★)
* 👀 **Live preview:** See the new line before applying it
* ↩️ **Restore original:** The launch options from before the first change are saved and can be restored with one tap
* 🎮 **Non-Steam shortcuts:** Work just like Steam games
* 🌍 **German and English:** Detected automatically and switchable

## 🛠️ Installation

1. **Prerequisites:**
   * A set up **Steam Frame** with the **Framey Plugin Loader** installed and the **Framey App** on the PC

2. **Via the Framey App (recommended):**
   * Download the latest release (`launch-arguments.zip`)
   * In the Framey App, select the ZIP file via **Browse** and press **Add plugin**. The app installs it automatically (SteamVR restarts)

3. **Manual installation:**
   * Copy the `launch-arguments` folder into the Framey `plugins/` directory
   * Open the Framey settings and select **Reload**

## 🚀 How to Use

1. Open the SteamVR Dashboard on the Steam Frame
2. Open the **Framey Plugin Menu** and select **Launch Arguments**
3. Pick a game. Its current launch options are shown at the top
4. Tap building blocks to switch them on or off. The preview turns yellow while there are unapplied changes
5. Tap **Apply**. Steam uses the new launch options the next time you start the game

## 🧩 Built-in building blocks

| Group | Building blocks |
|----------|----------|
| DLL overrides | `winhttp` (BepInEx), `version` (MelonLoader), `dinput8` (ASI Loader), `dxgi` (ReShade / Special K), `d3d11`, `winmm` |
| Steam | `SteamAppId=<app id>`, `SteamGameId=<app id>` (filled in with the game's ID) |
| Proton & debugging | `PROTON_LOG=1`, `PROTON_USE_WINED3D=1`, `PROTON_NO_ESYNC=1`, `PROTON_NO_FSYNC=1`, `DXVK_HUD=fps`, `WINEDEBUG=-all` |
| VR & Unity | `--osc=9000:127.0.0.1:9001`, `--no-vr`, `-screen-fullscreen 0`, `-window-mode borderless`, `-force-d3d11`, `-force-vulkan` |

## ⭐ Own building blocks

Own building blocks are available in every game, but each game keeps its own launch options.

* `NAME=value` is treated as a variable and placed in front of `%command%`
* Everything else (`-arg`, `--flag=x`, `-arg value`) is placed behind `%command%`
* One building block may contain several parts, e.g. `MY_VAR=1 -nolog`
* `{appid}` is replaced with the game's app ID

If typing doesn't work in the VR panel, there are two other ways:

* Type the option once into Steam's own launch options field, open the game in the plugin again and tap ★ next to it
* Add it over SSH to `~/.config/framey/launch-arguments.json`:

```json
{"custom": [{"id": "mymod", "label": "My mod", "value": "MY_MOD=1 -nolog"}]}
```

## 🔍 How it works

* The panel runs inside SteamVR, which can't change launch options itself. The backend talks to Steam's main page over the local debug port and calls `SteamClient.Apps.SetAppLaunchOptions`, the same way Steam's own properties dialog does
* If Steam's interface isn't reachable, the current launch options are read from `localconfig.vdf` / `shortcuts.vdf` (read only)
* Settings, own building blocks and saved originals are stored locally in `~/.config/framey/launch-arguments.json`. Nothing is sent anywhere

## ❓ Troubleshooting

* **"Steam's main page isn't reachable":** Make sure Steam is running, then open **Check Steam interface** on the start page and include the output in a bug report
* **Changes don't show in Steam's properties dialog:** Close and reopen the dialog. The game uses the new options on its next start

## ⚠️ Limitations

* DLL overrides from the buttons are set to `n,b` (native, then builtin). Other modes already in the launch options are kept
* Launch options apply on the next game start, not to a running game

## 🤝 Credits & Acknowledgments

* Thanks to the creators of the [**Framey Plugin Loader**](https://github.com/chaosfox26/framey)
* Part of the [Framey Plugins](https://github.com/Inazumanotenshi/Framey-Plugins) collection by Inazumanotenshi

Not affiliated with or endorsed by Valve or the Framey project. Use at your own risk.
