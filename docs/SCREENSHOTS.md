# Screenshots TODO (beatnik-pi docs)

Screenshots for the places marked `📸 Screenshot needed` in `beatnik-pi/docs/usage/`.
Finished images go to `beatnik-pi/docs/images/`. Each one then replaces its `::: warning 📸 Screenshot needed` block in the guide.

## Plan

### Capture methods

| Tag | Method | Used for |
|-----|--------|----------|
| **[A]** Automated | `npm run screenshots`: Playwright drives `ng serve` with every device interface faked (see below) | Everything except BLE Wi-Fi setup |
| **[N]** Native | iOS simulator or device (`npm run ios`) with a Pi nearby | BLE Wi-Fi setup. It uses Bluetooth, which the script doesn't fake |

What the script fakes, so no hardware is needed and real devices on the LAN are never contacted:

| Interface | Source of the fake data |
|-----------|-------------------------|
| Snapcast JSON-RPC (`ws://…:1780`) | `src/assets/mock/json/server-state.json` (also used by the app's demo mode) |
| Beatnik API (`http://…:3000/api/…`): system info, updates, hardware, CamillaDSP configs | [scripts/screenshot-mocks.mjs](../scripts/screenshot-mocks.mjs) |
| CamillaDSP WebSocket (`ws://…:1234`): Bass/Treble filters, stereo mixer, compressor with soft clip, live levels | [scripts/screenshot-mocks.mjs](../scripts/screenshot-mocks.mjs) |
| mDNS discovery (`window.mDNS` bridge of `@byrds/capacitor-mdns`) | [scripts/screenshot-mocks.mjs](../scripts/screenshot-mocks.mjs) |
| Preferences (username, server URL, presets) | `PREFERENCES` in [scripts/screenshots.mjs](../scripts/screenshots.mjs) |

### Conventions

- **Viewport:** 393×852 at DPR 3 (iPhone 15), to match the existing `docs/images/iphone15_screen.webp`.
- **Theme:** light, unless the guides already use dark. Use the same theme for every screenshot.
- **Format:** `.webp` at quality ~85, the same as the other images in `beatnik-pi/docs/images`.
- **Naming:** `app_<guide>_<slug>.webp`, for example `app_everyday_devices.webp`. The planned names are in the checklist below.
- **Close-ups** (quick-action buttons, swipe action): crop the full-screen capture rather than shooting at a different zoom.

### Usage

```sh
npm start                                   # dev server, in another terminal
npm run screenshots                         # all shots → screenshots/ (gitignored)
npm run screenshots -- devices dsp-filters  # only the named shots
SCREENSHOT_OUT=../beatnik-pi/docs/images npm run screenshots   # straight into the docs
```

A failed shot writes `screenshots/_failed_<name>.png`. Run with `DEBUG=1` to print Playwright's full call log.

### Steps

1. ✅ **Improve the mock data.** The mock now has 5 rooms (Living Room, Kitchen, Office, Terrace as a stereo pair, Bedroom), 6 clients with different speaker images and 4 streams (2 playing).
2. ✅ **Automate the Snapcast-only shots** (13), against a fake Snapcast server.
3. ✅ **Automate the device shots** (10 images) by faking the Beatnik API, CamillaDSP and mDNS. This also fixed the client-details Info tab.
4. ⏳ **Review all shots**, then copy them to `beatnik-pi/docs/images`.
5. ⏳ **Capture the [N] Wi-Fi setup shot manually** on the simulator or device. Then crop it and convert it to `.webp`.
6. ⏳ **Put the images into the guides.** Replace each warning block with `![…](../images/<name>.webp)` and tick its box below.

## Checklist

### Getting around (guide-getting-around.md)
- [ ] L19 **[A]** Connecting to your server: Settings screen with the Server Url field and **Connect to Server** button → `app_getting-around_connect.webp`
- [ ] L35 **[A]** App layout: bottom tab bar (Dashboard, Devices, Streams, Menu) and expanded player toolbar → `app_getting-around_layout.webp`

### Everyday use (guide-everyday-use.md)
- [ ] L13 **[A]** Quick-action buttons: close-up of the three round quick-action buttons → `app_everyday_quick-actions.webp`
- [ ] L53 **[A]** Devices: Devices tab with the Clients and Device Groups lists → `app_everyday_devices.webp`
- [ ] L72 **[A]** Stream details: stream details view, including the collapsible JSON section → `app_everyday_stream-details.webp`
- [ ] L86 **[A]** Volume presets: preset list with one swipe action expanded → `app_everyday_volume-presets.webp`
- [ ] L103 **[A]** Creating a preset: Capture Preset screen with per-group sliders and the **Save Preset** prompt → `app_everyday_capture-preset.webp`
- [ ] L118 **[A]** Stream presets: stream selector per group and the **Quick Assign All** list → `app_everyday_stream-presets.webp`

### Adding a device (guide-add-device.md)
- [ ] L7 **[N]** Step 1, Wi-Fi setup: Network Configuration with **Scan for Devices** and the Wi-Fi list → `app_add-device_wifi.webp`
- [ ] L20 **[A]** Step 2, server setup: Configure Device with **Setup as Server** / **Setup as Client** (`/setup-server/:ip`) → `app_add-device_server.webp`
- [ ] L44 **[A]** Step 4, name the device group: naming screen with **Save & Complete Setup** (`/setup-device-group-name/:ip`) → `app_add-device_name.webp`

### CamillaDSP (guide-camilladsp.md)
- [ ] L57 **[A]** Equalising: Filters section with filter cards (e.g. bass/treble) and gain sliders → `app_camilladsp_filters.webp`
- [ ] L94 **[A]** Mixers: mixer card with source gain, **Inverted** and **Muted** → `app_camilladsp_mixers.webp`
- [ ] L114 **[A]** Processors: compressor card and the **Soft clip** toggle → `app_camilladsp_processors.webp`
- [ ] L145 **[A]** Advanced settings: "Select a config" list and the **Set as default** button → `app_camilladsp_configs.webp` (list) + `app_camilladsp_set-default.webp` (button)

### Settings & help (guide-settings-help.md)
- [ ] L5 **[A]** Settings: Username, Server Url and **Scan for devices on startup** → `app_settings.webp`
- [ ] L22 **[A]** Demo mode: Menu with the **Enable Demo Mode** entry → `app_settings_demo-mode.webp`

### Maintenance (guide-maintenance.md)
- [ ] L5 **[A]** Device details: Now playing, Stream, Group Name, Clients → `app_maintenance_device-details.webp`
- [ ] L20 **[A]** Speaker image: speaker picker with type filter and search → `app_maintenance_speaker-picker.webp`
- [ ] L31 **[A]** Client details: client information panel, Info tab → `app_maintenance_client-details.webp`
- [ ] L57 **[A]** Updates: Beatnik Update screen with installed versions and update buttons → `app_maintenance_updates.webp`
- [ ] L71 **[A]** Server status: Server Status screen with restart / reboot actions → `app_maintenance_server-status.webp`
- [ ] L89 **[A]** Network scanner: scanner listing servers and clients (`/zeroconf`, mDNS) → `app_maintenance_scanner.webp`

**Totals:** 22 automated (23 images), 1 native.
