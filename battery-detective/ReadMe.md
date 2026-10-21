# Battery Detective for Framey (unofficial)

<img width="256" height="256" alt="battery-detective" src="https://github.com/user-attachments/assets/2da3c098-fe01-4506-a39b-52a0b775d3b5" align="center"/>

Shows how much battery each game consumes. Includes a live display with an estimated remaining runtime, a usage trend graph for the last hour, and a ranking list showing consumption per game (%/h, average wattage, and estimated playtime on a full charge).

## Installation
Install via the Framey app using the ZIP file, or copy the `battery-detective` folder into the `plugins/` directory and select "Reload" in the Framey settings.

## How it works
- The backend reads battery data (percentage, power output, temperature) from `/sys/class/power_supply` every 30 seconds and identifies the active game via the Steam process `reaper SteamLaunch AppId=…`.
- Data is only recorded while running on battery power. Charging periods, standby intervals, and implausible data spikes are excluded.
- Metrics for a specific game become reliable after approximately 5 minutes of measurement. Accuracy improves with more sessions.
- Data is stored in `~/.config/framey/battery-detective.json`.
- When a "Reload" is triggered, the previous measurement loop terminates automatically, preventing duplicate data. Up to 60 seconds of unsaved measurement data may be lost during this process.

## If nothing is displayed
Go to Settings → "Show Diagnostics" to view raw data from all detected battery devices and the identified App ID. This information can be used to adapt the plugin to your specific hardware. You can also manually select the battery source under "Battery Source" (this includes controller batteries).

## Languages
German, English, French, Spanish, Italian, and Portuguese (detected automatically; can be changed in the settings). Translations are AI-generated and should be reviewed for accuracy.

## Limitations
Non-Steam games will appear as "App <id>". The idle value (“menu / idle”) applies to everything outside of a game.
