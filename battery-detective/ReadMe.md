# Battery Detective for Framey (unofficial!)

<img width="256" height="256" alt="battery-detective" src="https://github.com/user-attachments/assets/2da3c098-fe01-4506-a39b-52a0b775d3b5" align="center"/>

Find out which games drain your **Steam Frame** battery the fastest. Battery Detective measures battery usage per game, estimates the remaining playtime, and helps you keep the battery healthy with an optional charge limit.

## 📸 Features

* 🔋 **Live readout:** Charge level, charging status, power draw (W) and temperature at a glance.
* ⏱️ **Remaining playtime:** Estimated from the current power draw, or from the stored history of the running game.
* 📈 **Trend chart:** Power draw (or charge level) over the last hour.
* 🏆 **Per-game ranking:** Battery use per game in %/h, average wattage, and how long a full battery lasts in that game.
* ⏸️ **Pause recording:** Pause or resume the statistics with one tap (with a small animation). The live readout keeps running while paused.
* 🛡️ **Battery Save (charge limit):** Stop charging at 70, 80 or 90 % to reduce battery wear, if the device allows it. Otherwise you get a reminder to unplug.
* ❤️ **Battery health:** Current capacity compared with the design capacity, plus the charge cycle count (when the device reports them).
* 🌍 **15 languages:** Detected automatically and switchable in the settings.

<img alt="Pausing and resuming the recording" src="recording-toggle.gif" width="640"/>

## 🛠️ Installation

1. **Prerequisites:**
   * A set up **Steam Frame** with the **Framey Plugin Loader** installed and the **Framey App** on the PC.

2. **Via the Framey App (recommended):**
   * Download the latest release (`battery-detective.zip`).
   * In the Framey App, select the ZIP file via **Browse** and press **Add plugin**. The app installs it automatically (SteamVR restarts).

3. **Manual installation:**
   * Copy the `battery-detective` folder into the Framey `plugins/` directory.
   * Open the Framey settings and select **Reload**.

**Updating from 0.1.0:** Install the new version the same way. Your recorded statistics are kept.

## 🚀 How to Use

1. Open the SteamVR Dashboard on the Steam Frame.
2. Open the **Framey Plugin Menu** and select **Battery Detective**.
3. Play as usual while the headset runs on battery. After about 5 minutes per game, its numbers become reliable and appear in the ranking.
4. Want to leave a session out of the statistics (e.g. a benchmark or a game left running in the background)? Tap **Pause** on the recording card and **Resume** when you're done.

## 🛡️ Battery Save (charge limit)

Lithium batteries age faster when they sit at 100 % for a long time. Under **Settings → Battery Save** you can choose a limit of 70, 80 or 90 % (or Off). The plugin checks what your device supports and tells you right below the buttons which of these applies:

| Mode | What happens |
|----------|----------|
| ✅ Hardware limit | The charger itself stops at the limit, even while Framey is closed. The plugin re-applies the limit after a reboot. (`charge_control_end_threshold`) |
| ✅ Charging pause | The plugin pauses charging at the limit and resumes it a few percent below. Only works while Framey is running. (`charge_behaviour`) |
| ⚠️ No permission | The device has a charge limit, but Framey isn't allowed to set it (root required). You get a reminder instead. |
| ⚠️ Not supported | The device offers no charge limit. Once the limit is reached while charging, the plugin shows a banner and a notification to unplug. |

Notes:
* The plugin only touches the charge limit when you pick one yourself. If SteamOS manages a charge limit of its own, it is left alone while Battery Save is off.
* Setting Battery Save back to **Off** restores normal charging to 100 %.

## ⚙️ Settings

* **Language:** Choose the display language manually (default: system language).
* **Battery source:** Pick which battery to read. **Auto** prefers the headset battery over controller batteries.
* **Battery Save:** See above.
* **Show diagnostics:** Raw values of all detected batteries, the detected App ID, and whether the charge-limit files exist and are writable. Handy for bug reports.
* **Delete all data:** Resets all statistics (tap twice to confirm).

## 🔍 How it works

* Every 30 seconds the backend reads the battery values from `/sys/class/power_supply` and detects the running game via the Steam process `reaper SteamLaunch AppId=…`.
* Usage is only recorded while running on battery. Charging, standby gaps and implausible spikes are ignored.
* Resuming after a pause starts a fresh session, so the paused time never counts toward a game.
* Data is stored locally in `~/.config/framey/battery-detective.json`. Nothing is sent anywhere.
* When Framey reloads, the old measurement loop stops on its own, so nothing gets counted twice. Up to 60 seconds of unsaved data may be lost.

## ❓ Troubleshooting

* **Nothing is displayed / "No battery found":** Open **Settings → Show diagnostics**. If several batteries are listed, choose the right one under **Battery source**.
* **A game shows "not enough data yet":** It needs about 5 minutes of play on battery first.
* **Battery Save says "no permission" or "not supported":** This depends on the hardware and SteamOS. Please open an issue with the diagnostics output so support can be added if possible.
* **Japanese, Korean or Chinese text shows boxes:** The required font is missing on the device.

## 🌍 Languages

German, English, French, Spanish, Italian, Portuguese, Dutch, Polish, Swedish, Russian, Ukrainian, Turkish, Japanese, Korean and Simplified Chinese.

Translations are AI-generated. Corrections from native speakers are very welcome (open an issue or pull request).

## ⚠️ Limitations

* Non-Steam games appear as "App &lt;id&gt;".
* The "Menu / idle" entry covers everything outside of a game.
* The remaining-time estimate is a guide, not a guarantee. It changes with brightness, refresh rate and the scene you're in.

## 🤝 Credits & Acknowledgments

* Thanks to the creators of the [**Framey Plugin Loader**](https://github.com/chaosfox26/framey).
* Part of the [Framey Plugins](https://github.com/Inazumanotenshi/Framey-Plugins) collection by Inazumanotenshi.

Not affiliated with or endorsed by Valve or the Framey project. Use at your own risk.
