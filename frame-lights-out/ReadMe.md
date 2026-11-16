# Frame Lights Out for Framey (unofficial!)

Turns off the status LED on the side of the **Steam Frame**. Handy when you use the headset in a dark room and the light bothers someone else.

Maintained at https://github.com/adepssimius/frame-lights-out (MIT License). This folder is a copy of release v1.0.1.

## Features

* **Toggle in Quick Settings:** a "Status light" switch under Airplane mode in SteamVR's Quick Settings
* **Framey tab:** the same switch in the Framey panel under "Light"
* **Stays off:** the light is darkened again whenever the headset would relight it (charger plugged in, low battery, wake)
* **Remembered:** the setting is saved and applied again when Framey starts
* **No root:** the LED is writable by the `steamos` user

## Installation

1. **Prerequisites:**
   * A set up **Steam Frame** with the **Framey Plugin Loader** installed

2. **Via Framey's Settings tab:**
   * Paste this link and press **Install**:
     `https://github.com/adepssimius/frame-lights-out/releases/latest/download/frame-lights-out.zip`

3. **Via the Framey App:**
   * Download `frame-lights-out.zip` from the [latest release](https://github.com/adepssimius/frame-lights-out/releases/latest) and add it with **Browse**

4. **Manual installation:**
   * Copy the `frame-lights-out` folder into the Framey `plugins/` directory
   * Open the Framey settings and select **Reload**

## How to Use

1. Open the SteamVR Dashboard on the Steam Frame
2. Open Quick Settings (the clock and battery area of the bar)
3. Switch **Status light** off

## Limits

* While the headset is asleep nothing can run, so the LED shows whatever the system set just before sleep, for example the charging colour
* The Quick Settings row works with the laser pointer and hands; controller D-pad focus skips it
* If a Steam update restructures Quick Settings the row can disappear. The Framey tab keeps working
* Tested on one headset in November 2026
