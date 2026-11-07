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
11. [Camilla DSP (audio processing)](#11-camilla-dsp-audio-processing)
12. [Updates](#12-updates)
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
- For the **Line-In** stream, the [Camilla DSP](#11-camilla-dsp-audio-processing) controls are shown in `linein` mode.
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
| **Camilla DSP** | Live audio levels and DSP controls - see [Camilla DSP](#11-camilla-dsp-audio-processing). |
| **Soundcard** | Current soundcard configuration and detected hardware. Tap **Choose Soundcard** to open the picker with images, search and "Tested by Beatnik / Community" badges. Use the refresh icon to re-read the hardware. |
| **Info** | System information: temperature, RAM usage, hostname, IP addresses, OS, model, storage type, MAC address, architecture, Wi-Fi SSID, band and frequency, link quality, signal and noise level, plus Snapcast client info (volume, muted, latency, connection state, last seen). |
| **Settings** | Snapcast server status (active/inactive), **Choose Speakers** and **Reboot Device** actions. |
| **Update** | Software update for this device - see [Updates](#12-updates). |

---

## 11. Camilla DSP (audio processing)

[CamillaDSP](https://github.com/HEnquist/camilladsp) runs on each Beatnik for equalising and processing audio. Controls are found under **Device > Camilla DSP** and in the **Line-In** stream details. The app connects to the device automatically; use the retry button if the connection drops. If no network address is available for a device, open it from the device list or the network scanner, or set the server address in [Settings](#15-settings).

- **Level meters:** view signal levels for **Capture (Snapcast)** and **Playback**, left and right. Switch the display style between **Bars**, **Gauge**, **Lines** and **Rotary**.
- **Master volume and gain:** adjust in dB using sliders or rotary knobs.
- **Mixer:** channel source gains with *Inverted* and *Muted* toggles.
- **Processors:** per-channel processing blocks (for example dynamics and soft clip).
- **Default config:** pick a CamillaDSP configuration file stored on the device (with search) and save it as the default.
- **Advanced:** connect/disconnect and inspect the DSP state, configuration (JSON/YAML), update interval and signal levels.

---

## 12. Updates

Open **Menu > Beatnik Update**, or the **Update** tab in the client details.

- The overview shows the installed versions and whether an update is currently running (*Update running...* / *Idle*).
- Update everything with one button, or update a single component: **bleno** (Bluetooth setup service), **controller** or **api**.
- **Refresh** reloads the current status. Failed updates are flagged so you can retry.

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
