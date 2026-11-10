# Beatnik Controller - Usage Guide

This guide walks through every feature of Beatnik Controller, from first-time setup to day-to-day listening and device maintenance. For installation instructions see the [README](../README.md) and [Docker installation guide](./DOCKER_INSTALLATION.md).

## Contents

1. [Concepts](#1-concepts)
2. [Connecting to your server](#2-connecting-to-your-server)
3. [App layout](#3-app-layout)
4. [Dashboard](#4-dashboard)
5. [Devices](#5-devices)
6. [Streams](#6-streams)
7. [Volume presets](#7-volume-presets)
8. [Stream presets](#8-stream-presets)
9. [Adding a new Beatnik device](#9-adding-a-new-beatnik-device)
10. [Device details and maintenance](#10-device-details-and-maintenance)
11. [Camilla DSP and equalising](#11-camilla-dsp-and-equalising)
12. [Updating](#12-updating)
13. [Server status and maintenance](#13-server-status-and-maintenance)
14. [Network scanner](#14-network-scanner)
15. [Settings](#15-settings)
16. [Demo mode](#16-demo-mode)
17. [Web vs. mobile app](#17-web-vs-mobile-app)
18. [Troubleshooting](#18-troubleshooting)

---

## 1. Concepts

Beatnik Controller is a remote control for a [Snapcast](https://github.com/badaix/snapcast) multi-room audio system. A few terms appear throughout the app:

| Term | Meaning |
|------|---------|
| **Server** | The Snapcast server. It receives audio from sources (streams) and distributes it to all clients. Your first Beatnik device normally becomes the server. |
| **Client** | A device that plays audio (for example a Beatnik Pi with an amplifier or soundcard). |
| **Group** | One or more clients that play the same stream in sync. In the app a group is shown as a "device" (for example "Living Room"). |
| **Stream** | An audio source on the server, such as AirPlay, Spotify Connect, Line-In or radio. A stream is assigned to a group. |
| **Preset** | A saved snapshot of volume levels or stream assignments that you can re-apply with one tap. |

---

## 2. Connecting to your server

By default the app looks for a Snapcast server at `beatnik-server.local`.

- **Settings:** open **Menu > Settings**, enter the server address in **Server Url**, then tap **Connect to Server** (see [Settings](#15-settings)).
- **Network scanner (mobile app):** open **Menu > Search Devices** and tap **Set as Server** next to your server (see [Network scanner](#14-network-scanner)).
- **Setup wizard:** adding a new Beatnik device configures the connection for you (see [Adding a new Beatnik device](#9-adding-a-new-beatnik-device)).

If no server can be reached, the dashboard shows an onboarding card with an **Add** button and a **Search for existing Device on Network** shortcut.

---

## 3. App layout

A tab bar at the bottom of the screen gives access to the main areas:

| Tab | Purpose |
|-----|---------|
| **Dashboard** | Overview of your devices and streams, quick access to presets. |
| **Devices** | List of all clients and device groups. |
| **Streams** | List of all streams, active ones first. |
| **Menu** | Settings, server status, network scanner, demo mode and updates. |

A **player toolbar** with cover art, title, artist and per-group volume sliders is available while audio is playing. Tapping a tab collapses it back to its compact size.

---

## 4. Dashboard

The dashboard greets you with your name (set in [Settings](#15-settings)) and the current date.

### Quick-action buttons

Three round buttons at the top show live status and double as shortcuts:

| Button | Shows | Tap to open |
|--------|-------|-------------|
| Volume icon | `playing / total` clients | [Volume presets](#7-volume-presets) |
| Wi-Fi icon | Online/Offline and the time of the last server response | [Server status](#13-server-status-and-maintenance) |
| Music note icon | `playing / total` streams | [Stream presets](#8-stream-presets) |

### Devices carousel

Swipe through your connected device groups. Each card shows:

- The speaker image chosen for the group
- Album art, title, artist and album of the current stream
- A play/stop status icon and a Wi-Fi icon per client (greyed out when disconnected)
- The group name

Actions:

- **Tap** a card to open the [device details](#10-device-details-and-maintenance).
- **Long-press** a card to choose a different [speaker image](#speaker-image).
- Offline groups appear with a cloud-offline overlay.
- Tap the **+** icon next to *Devices* to [add a new device](#9-adding-a-new-beatnik-device).

### Streams carousel

Swipe through all streams with their status (`playing` / `idle`), source icon and metadata. Tap a stream to open its details.

### Pull to refresh

Pull down on the dashboard to reload the server state.

---

## 5. Devices

The **Devices** tab has two lists:

- **Clients** - every client with its name, ID, group, volume, last-seen time and connection state. Tap a client to open its [client details](#client-details).
- **Device Groups** - every group with its number of clients. Tap a group to open its [device details](#10-device-details-and-maintenance).

---

## 6. Streams

The **Streams** tab lists all streams. Active (non-idle) streams appear first, followed by **Inactive Streams**. Each card shows the stream name, status, source icon and the current album art, album, artist and title.

### Stream details

Tap a stream to see its details:

- The raw stream configuration in a collapsible JSON section (useful for debugging).
- For the **Line-In** stream, the [Camilla DSP](#11-camilla-dsp-and-equalising) controls are shown in `linein` mode.
- For the **Hof-Bar-Radio** stream, a Mopidy player with stop / play / pause buttons and an **Initialize Hof-Bar Radio** button is shown.

---

## 7. Volume presets

Volume presets store the volume of every client so you can switch between listening scenarios (for example "Party", "Night", "Dinner").

Open them from the dashboard (volume button) or directly at `/volume-presets`.

| Action | How |
|--------|-----|
| **Apply** | Tap a preset. A toast confirms when all volumes are set. |
| **Edit** | Swipe the preset to the right and tap the pencil. |
| **Delete** | Swipe the preset to the left and tap the trash can. |
| **Create** | Tap **Create / Capture Preset**. |

### Creating a preset

1. Set your speakers to the desired volumes (for example in the player toolbar).
2. Tap **Create / Capture Preset**, then **Capture Preset** to record the current volume of every group.
3. Fine-tune each group with its slider (0-100 %).
4. Tap **Save Preset**; a prompt asks for a name and an optional description.

When editing, **Re-Capture Current Setup** replaces the stored values with the current live volumes.

---

## 8. Stream presets

Stream presets store which stream is assigned to which group, so you can re-route the whole house in one tap.

Open them from the dashboard (music-note button) or directly at `/stream-presets`. Creating, editing, applying and deleting work like [volume presets](#7-volume-presets), but each group has a **stream selector** instead of a volume slider.

**Quick Assign All** lists automatically generated presets of the form *"All to \<stream\>"* that assign one stream to every group.

---

## 9. Adding a new Beatnik device

Tap **+** on the dashboard (or the big button on the onboarding card) to start the setup. Setup runs in the **mobile app** and uses Bluetooth Low Energy.

### Step 1 - Wi-Fi setup (`Network Configuration`)

1. Plug in your Beatnik. Hold the setup button for 5 seconds until the LED pulses blue.
2. Make sure your phone is connected to your home Wi-Fi (the app warns you if it is on cellular).
3. Tap **Scan for Devices** and wait for the app to find and connect to the Beatnik.
4. Pick one of the Wi-Fi networks the Beatnik found (name, signal quality, security and band are shown).
5. Enter the Wi-Fi password (use the eye icon to reveal it) and start provisioning.
6. Wait for the connection status. When the Beatnik is online, its IP address, hostname and device ID are shown. Tap **Continue**.

### Step 2 - Server setup (`Configure Device`)

The app searches for existing Snapcast servers on your network:

- **First Beatnik device:** it is configured as your **Snapcast Server**. Tap **Setup as Server**, or **Setup as Client** to override.
- **Server already exists:** you are asked whether to set the device up as a **Snapcast Client** (**Yes, Setup as Client**). Choosing **No, Setup as Server** shows a warning, because multiple servers can cause conflicts.

The app then validates the connection to the server.

### Step 3 - Audio setup

Choose the soundcard configuration:

- **Detected Soundcard** - use the hardware the Beatnik detected automatically.
- **Manual** - select your soundcard from the list and tap **Apply Manual Soundcard Config**. Some soundcards cannot be detected automatically.

Tap **Continue** when finished.

### Step 4 - Name the device group

Give the device a descriptive name such as "Living Room Amp" or "Kitchen Audio" and tap **Save & Complete Setup**. A group can contain a single device or several.

---

## 10. Device details and maintenance

Open a group from the dashboard or **Devices > Device Groups**.

### Group controls

- **Now playing** card for the active stream (cover, stream, title, artist).
- **Stream** - switch the stream the group plays.
- **Group Name** - rename the group.
- **Clients** - select the clients that belong to the group.

### Speaker image

Long-press the group card (dashboard or device details) or use **Choose Speakers** in the settings tab to open the speaker picker:

- Filter by type using the segments (**All** plus the available speaker types) or search by brand/model.
- Tap a speaker to select it and press **Save**. The image appears on the group card everywhere in the app. An empty option is available if you prefer no speaker image.

### Client details

The client information panel has five tabs:

| Tab | Content |
|-----|---------|
| **Camilla DSP** | Live audio levels and DSP controls - see [Camilla DSP](#11-camilla-dsp-and-equalising). |
| **Soundcard** | Current soundcard configuration and detected hardware. Tap **Choose Soundcard** to open the picker with images, search and "Tested by Beatnik / Community" badges. Use the refresh icon to re-read the hardware. |
| **Info** | System information: temperature, RAM usage, hostname, IP addresses, OS, model, storage type, MAC address, architecture, Wi-Fi SSID, band and frequency, link quality, signal and noise level, plus Snapcast client info (volume, muted, latency, connection state, last seen). |
| **Settings** | Snapcast server status (active/inactive), **Choose Speakers** and **Reboot Device** actions. |
| **Update** | Software update for this device - see [Updates](#12-updating). |

---

## 11. Camilla DSP and equalising

[CamillaDSP](https://github.com/HEnquist/camilladsp) is the audio processing engine on each Beatnik. It sits between Snapcast and the soundcard and is what makes equalising, volume trim, channel mixing and dynamics control possible. The app talks to it live, so you can hear every change while you make it.

### 11.1 How it works

CamillaDSP processes audio as a pipeline defined in a **config file** stored on the device. A typical Beatnik pipeline looks like this (the exact order and content depend on the config):

```
Snapcast audio (capture) > Mixer > Filters (EQ) > Processors (compressor) > Soundcard (playback)
```

| Block | What it does | Controls in the app |
|-------|--------------|---------------------|
| **Master volume** | Overall level of the device in dB. | Adjustable |
| **Filters** | The equaliser. Each filter is one EQ band, for example a bass boost or treble cut. | Gain adjustable. Type, frequency and Q are shown but read-only |
| **Mixers** | Routes input channels to output channels. | Per-source gain, invert and mute |
| **Processors** | Dynamics processing (compressor) and soft clipping. | Threshold, ratio, attack, release, makeup gain, soft clip |

The filters, mixers and processors you see depend entirely on the active config file. If a block does not exist in the config, it is not shown in the app.

### 11.2 Opening the controls

| Where | What you control |
|-------|------------------|
| **Devices > Clients > (client) > Camilla DSP tab** | The playback DSP of that device. |
| **Streams > Line-In** | The separate line-in (preamp) DSP, shown only for the Line-In stream. |

The app connects automatically and shows *Connecting to CamillaDSP...* and *Loading configuration...* while it waits. If the device cannot be reached, a message with a **Retry** button appears and the app retries every few seconds. If no address is known for a device, open it from the device list or the network scanner, or set the server address in [Settings](#15-settings).

### 11.3 Equalising

The **Filters** section is your equaliser. Every filter in the config appears as a card with:

- **Name** - the filter name from the config, for example `bass` or `treble`.
- **Type** - the filter type (for example a shelf or peaking filter). Read-only.
- **Gain** - the amount of boost or cut in dB. This is the control you adjust.
- **Frequency** and **Q** - where the filter acts and how wide it is. Read-only.

To equalise:

1. Open the **Camilla DSP** tab of the device you want to adjust.
2. Start music so you can hear the effect.
3. Find the filter card for the band you want to change (for example the bass band).
4. Drag the slider or knob, or type a value into the number field. The range is -12 dB to +12 dB in 1 dB steps on sliders and knobs.
5. Repeat for the other bands. Use gentle changes: a few dB is usually enough, and large boosts can cause clipping.

Tips:

- **Cut rather than boost.** If something sounds too harsh, reduce that band instead of raising the others. Lowering the master volume slightly before boosting avoids distortion.
- **Check the playback meters.** If the peak reaches 0 dB, reduce the gain or enable **Soft clip** (see below).
- **Different bands or frequencies:** the app changes only the gain. To change frequencies, Q or filter types, pick a different config file under [Advanced settings](#119-advanced-settings-config-files).
- **Per device:** every client has its own EQ, so you can tune each room separately.

Note: gain changes are sent to the running CamillaDSP immediately but are not written to the config file by the app. If CamillaDSP restarts, or you apply a config with **Set as default**, the values from the config file are used again.

### 11.4 Master volume

**Master** controls the overall level of the DSP in dB. Type a value or use the slider or knob. This is separate from the Snapcast volume you set in the player toolbar and in volume presets. Use it to set a sensible overall level and leave the Snapcast volume for day-to-day changes.

### 11.5 Mixers

Each mixer card shows its output channel count and, for every destination channel (the first is Left, the second Right), its source channels with:

- **Source gain** - level of that source in dB (-12 to +12).
- **Inverted** - flips the polarity of the signal. Use it to fix speakers that are wired out of phase.
- **Muted** - silences that source.

Mixers are useful for channel balance, swapping left and right, or muting one side while testing.

### 11.6 Processors (dynamics)

If the config contains a compressor, each processor card shows its name and type, plus the channels it works on (**Total**, **Monitor** and **Process**). The following controls are available:

| Control | Range | Effect |
|---------|-------|--------|
| **Threshold** | -60 to 0 dB | Level above which compression starts. |
| **Ratio** | 1 to 20 : 1 | How strongly levels above the threshold are reduced. |
| **Attack** | 0.001 to 1 s | How quickly compression engages. |
| **Release** | 0.01 to 2 s | How quickly compression lets go. |
| **Makeup gain** | 0 to 24 dB | Level added after compression to compensate for the reduction. |
| **Soft clip** | On / Off | Gently rounds off peaks instead of hard clipping. |
| **Clip limit** | -24 to 0 dB | Level at which soft clipping starts. Shown when Soft clip is on. |

Applying processor changes restarts the audio pipeline, so the app waits until you stop dragging before it sends the change. Expect a brief interruption in the audio while the change is applied.

### 11.7 Signal levels

The **Signal Levels** section at the top shows what is flowing through the DSP, updated continuously for left and right channels:

- **Capture (Snapcast)** - the audio arriving from the stream.
- **Playback** - the audio leaving towards the soundcard, after your EQ and processing.

Each meter shows the RMS (average) level and the peak level. Switch the display with **Bars** or **Gauge**. The gauge scale runs from -60 dB to 0 dB. Comparing capture and playback tells you how much gain your settings add.

### 11.8 Control style

The **Master** header has a **Lines** / **Rotary** switch. **Lines** shows sliders with number fields. **Rotary** shows knobs. The choice applies to all controls (master, filters, mixers and processors). The meter style and control style are remembered on your device.

### 11.9 Advanced settings (config files)

At the bottom, **Advanced Settings** lets you choose which CamillaDSP config file the device loads by default. Only change this if you know what you are doing, because the config defines the whole pipeline (EQ bands, mixers, processors and soundcard format).

1. Tap the config button to open the **Select a config** list.
2. Search by file name. The config that is currently active is marked **Current**.
3. Tap a file. The picker closes and the file is selected (press **Done** to close the list without choosing).
4. Tap **Set as default**. The device applies the config and CamillaDSP restarts. A confirmation shows the new default.
5. **Refresh** reloads the list of config files and the current default.

For the **Line-In** stream the same section manages the config of the line-in (preamp) DSP, which is a separate CamillaDSP instance from the playback DSP. This only works if a preamp is set up on the device.

At the very bottom, the collapsible **CamillaDSP Connection** section shows the WebSocket address, the connection status and the raw messages and configuration. It is meant for debugging.

### 11.10 Troubleshooting Camilla DSP

| Problem | What to try |
|---------|-------------|
| *CamillaDSP not reachable* | Check the device is on and on the same network, then tap **Retry**. |
| *No configuration received* | CamillaDSP is connected but has no config loaded. Pick one under Advanced settings. |
| No filters or processors shown | The active config does not define any. Choose a different config file. |
| Distortion after boosting | Lower the gain of the boosted band or the master volume, or enable **Soft clip**. |
| "No config files found on this device" | The device returned no config files. Make sure the device is online and up to date (see [Updates](#12-updating)). |
| Line-In config list fails to load | No line-in (preamp) is set up on this device. |
| EQ changes disappeared | Gain changes are live only. They reset when CamillaDSP restarts or a config is applied. |

---

## 12. Updating

There are three things you can update, and each is updated differently:

| What | How |
|------|-----|
| **Beatnik devices** (Bluetooth setup service, controller, hardware API) | In the app, see [12.1](#121-updating-a-beatnik-device-from-the-app) |
| **Beatnik Controller web app in Docker** (when you run it yourself) | With Docker Compose, see [12.5](#125-updating-the-controller-docker-container-manually) |
| **iOS / Android app** | Through the App Store or Play Store |

### 12.1 Updating a Beatnik device from the app

Each Beatnik runs three components that can be updated from the app:

| Component | What it is | How it is updated |
|-----------|------------|-------------------|
| **bleno** | Bluetooth service used for adding the device and Wi-Fi setup. | Latest release package installed with apt |
| **controller** | The Beatnik Controller web interface running on the device. | Latest Docker image pulled |
| **api** | The Hardware API used for soundcards, system info, Camilla DSP configs, reboot and updates. | Latest release package installed with apt |

Update a device in either of two ways:

- **From the client details:** open **Devices > Clients > (client)** and select the **Update** tab. The device address is filled in automatically and cannot be edited. This is the recommended way and the only reliable one in the mobile app.
- **From the menu:** open **Menu > Beatnik Update**. The app updates the device that serves the page, so this works best when you open Beatnik Controller from the Beatnik itself in a web browser. In the iOS and Android apps there is no such host, so use the **Update** tab of the client, or Expert mode and enter the device address.

Before you start:

- Make sure the device is powered on, online and on the same network as your phone or computer.
- Make sure the device has internet access, because updates are downloaded from the internet.
- Keep the screen open until the update has finished.
- Expect services to restart during the update, so audio can be interrupted. Update when nobody is listening.

### 12.2 Simple mode

Simple mode is the default and is what most people need.

1. Open the **Update** tab. The app checks the device and shows **Ready to update**.
2. Tap **Update now**. This installs the latest version of everything (bleno, controller and api, in that order).
3. Keep the screen open. A progress bar shows **Updating...**.
4. When the API restarts you will see **Restarting...** for a few seconds. This is normal. The app keeps waiting and continues automatically once the device is back.
5. When it is finished the status returns to **Ready to update**, and the installed versions are refreshed.

Status messages:

| Message | Meaning |
|---------|---------|
| *Checking...* | The app is asking the device for its status. |
| *Ready to update* | The device is reachable and idle. |
| *Updating...* | An update is running. Keep the screen open. |
| *Restarting...* | The Hardware API is restarting after its update. Wait a moment. |
| *Update failed* | At least one component failed. Try again, or open Expert mode for details. |
| *Can't reach your Beatnik* | The device is off, or not on the same network. |

Tap **Check again** to reload the status. The button is disabled while an update is running.

### 12.3 Expert mode

Switch on the **Expert** toggle in the header of the Update section to see more detail. The choice is remembered on your device.

- **Host** - address of the device to update. Editable when you opened the page from **Menu > Beatnik Update**, locked in the client's Update tab.
- **Refresh** - reload status and versions.
- **Update bleno / Update controller / Update api / Update all** - update a single component, or all of them in order. Updating all stops at the first failure.
- **Status cards** - for every component the last state (`idle`, `running`, `success` or `failed`), a message, the start and finish time and the tail of the update log. Use the log when an update fails.
- **Installed versions** - the installed version of each component, its Docker image and image ID where relevant, or *not installed* if the component is not present on the device.

Use Expert mode to update only one component, to read logs after a failed update, or to enter the address of another device.

### 12.4 Troubleshooting updates

| Problem | What to try |
|---------|-------------|
| *Can't reach your Beatnik* | Check power and network. Open the device from the device list or the network scanner so the correct address is used. |
| *Another update is already running* | Wait until the running update has finished, then try again. Only one update can run at a time. |
| *Update failed* | Open Expert mode and read the log of the failed component. Check that the device has internet access and enough free storage, then try again. |
| A component shows *not installed* | That component is not set up on this device. Updating it is not possible and will report an error. |
| The app shows *Restarting...* for a long time | Wait a minute. If the device does not come back, check that it is powered on and reachable, then tap **Check again**. |
| Nothing happens in the mobile app on **Menu > Beatnik Update** | That page updates the host that serves the app, which is not a Beatnik in the mobile app. Use the client's **Update** tab or Expert mode and enter the device address. |

After a successful update, switch on Expert mode and check **Installed versions** to confirm the new versions. If something still behaves oddly, a [restart or reboot](#13-server-status-and-maintenance) often helps.

### 12.5 Updating the controller Docker container manually

If you run Beatnik Controller yourself with Docker Compose, update it from the folder containing your `docker-compose.yml`:

```bash
git pull
docker compose pull
docker compose up -d
```

To stay on a specific version, replace `latest` in the image name of `docker-compose.yml` with a version tag (for example `v0.5.6`) before pulling:

```yaml
services:
  beatnik:
    image: ghcr.io/byrdsandbytes/beatnik-controller:v0.5.6
```

For the underlying operating system packages of a Beatnik Pi, see the [Docker installation guide](./DOCKER_INSTALLATION.md). The list of changes in each release is in the [CHANGELOG](../CHANGELOG.md).

---

## 13. Server status and maintenance

Open **Menu > Server Status** (or tap the Wi-Fi button on the dashboard).

- **Information:** host name, IP address, OS/architecture, Snapserver version, and counts of groups, clients and streams.
- **Clean Offline Clients:** remove clients that are no longer connected.
- **JSON Server Response:** raw server state for debugging.
- **Restart** (does not reboot the device): Snapserver, all Snapclients, or Snapserver and Snapclients.
- **Reboot:** reboot the server, all clients, or the server and all clients. A confirmation alert is shown before restarts and reboots.

If the server cannot be reached, tap **Attempt to Connect** to retry.

---

## 14. Network scanner

Open **Menu > Search Devices**. The scanner uses mDNS/ZeroConf to find:

- **Servers** - Snapcast servers on your network. Tap **Set as Server** to use one.
- **Clients** - Beatnik devices, with their MAC address, model, version and RAM. Tap **View Device** to open its details.

Use the scan/stop buttons in the header or at the bottom. The scanner works only in the iOS and Android apps, not in a web browser.

---

## 15. Settings

Open **Menu > Settings**.

| Setting | Description |
|---------|-------------|
| **Username** | Personalises the dashboard ("Alex's Home"). |
| **Server Url** | Host name or IP address of your Snapcast server. |
| **Scan for devices on startup** | Automatically search for devices when the app starts. |
| **Connect to Server** | Reconnects to the entered server URL. |

---

## 16. Demo mode

**Menu > Enable Demo Mode** loads a mock server state with sample devices and streams so you can explore the app without any hardware.

---

## 17. Web vs. mobile app

| Feature | Web | iOS / Android |
|---------|:---:|:-------------:|
| Dashboard, devices, streams | Yes | Yes |
| Volume and stream presets | Yes | Yes |
| Camilla DSP, updates, server status | Yes | Yes |
| Network scanner (mDNS) | No | Yes |
| Add device via Bluetooth/Wi-Fi setup | No | Yes |
| Haptic feedback | No | Yes |

---

## 18. Troubleshooting

| Problem | What to try |
|---------|-------------|
| Dashboard shows "Set Up Your Beatnik" | The server is unreachable. Check **Settings > Server Url**, or use the network scanner. |
| Dashboard shows "Offline" | The last server response is older than a few minutes. Open [Server status](#13-server-status-and-maintenance) and tap **Attempt to Connect**, or restart the Snapserver. |
| Device not found during setup | Hold the setup button for 5 seconds until the LED pulses blue, keep Bluetooth enabled and stay close to the device. |
| Setup fails on Wi-Fi | Make sure the phone is on the same Wi-Fi network and the password is correct. |
| A client is greyed out | The client is offline. Check power and network, restart it, or use **Clean Offline Clients** to remove it permanently. |
| Camilla DSP does not connect | Open the device from the device list or scanner so a network address is known, then retry. |
| No sound after a device was added | Check the soundcard configuration in the client's **Soundcard** tab. |

For further help, see [CONTRIBUTING.md](../CONTRIBUTING.md) or open an issue on [GitHub](https://github.com/byrdsandbytes/beatnik-controller/issues).
