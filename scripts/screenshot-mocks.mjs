/**
 * Fake device data for scripts/screenshots.mjs.
 *
 * Shapes follow the app's service types:
 *   - Beatnik API (http://<host>:3000/api/...): src/app/services/beatnik-*.service.ts
 *   - CamillaDSP websocket (ws://<host>:1234): src/app/services/camilla-dsp.service.ts
 *   - mDNS (window.mDNS bridge of @byrds/capacitor-mdns)
 */

// ---------------------------------------------------------------------------
// Beatnik API

const ago = (minutes) => new Date(Date.now() - minutes * 60_000).toISOString();

const HAT = {
  id: 'hifiberry-amp4',
  name: 'HiFiBerry Amp4',
  overlay: 'hifiberry-dacplus-std',
  camilla: { device: 'hw:sndrpihifiberry', format: 'S32LE', channels: 2 },
};

const CAMILLA_CONFIGS = [
  'beatnik_default.yml',
  'beatnik_loudness.yml',
  'beatnik_bass_boost.yml',
  'beatnik_night_mode.yml',
  'living_room_room_correction.yml',
];

/** Responses keyed by `METHOD /api/...` path. */
export const BEATNIK_API = {
  'GET /api/system/info': {
    hostname: 'beatnik-livingroom',
    ipAddresses: ['192.168.1.151'],
    totalRam: 3796,
    freeRam: 2741,
    temperature: 47.2,
    os: 'Debian GNU/Linux 12 (bookworm)',
    macAddress: '2c:cf:67:f0:f9:4a',
    storageType: 'SD card',
    model: 'Raspberry Pi 4 Model B Rev 1.5',
    networkQuality: {
      interface: 'wlan0',
      ssid: 'Home',
      band: '5GHz',
      frequency: 5180,
      linkQuality: 86,
      signalLevel: -52,
      noiseLevel: -92,
    },
  },
  'GET /api/update/status': {
    busy: false,
    targets: [
      { target: 'bleno', state: 'idle' },
      { target: 'controller', state: 'success', startedAt: ago(61), finishedAt: ago(59), message: 'Updated to 0.8.2' },
      { target: 'api', state: 'idle' },
    ],
  },
  'GET /api/update/versions': {
    versions: [
      { target: 'bleno', installed: true, version: '0.4.1', image: 'ghcr.io/byrdsandbytes/beatnik-bleno:latest', imageId: 'sha256:4f2a9c1e7b3d' },
      { target: 'controller', installed: true, version: '0.8.2', image: 'ghcr.io/byrdsandbytes/beatnik-controller:latest', imageId: 'sha256:9b81d0e44a6c' },
      { target: 'api', installed: true, version: '0.6.0', image: 'ghcr.io/byrdsandbytes/beatnik-api:latest', imageId: 'sha256:c03e5f7a12d8' },
    ],
  },
  'GET /api/snapcast/status': { active: true, enabled: true },
  'GET /api/hardware/hats': [
    HAT,
    { id: 'hifiberry-dacplus', name: 'HiFiBerry DAC+', overlay: 'hifiberry-dacplus', camilla: { device: 'hw:sndrpihifiberry', format: 'S32LE' } },
    { id: 'iqaudio-digiamp', name: 'Raspberry Pi DigiAMP+', overlay: 'iqaudio-dacplus', camilla: { device: 'hw:IQaudIODAC', format: 'S16LE' } },
  ],
  'GET /api/hardware/status': {
    currentConfig: HAT,
    detectedHardware: HAT,
    isMatch: true,
    eepromReadDisabled: false,
    camillaConfigFile: 'beatnik_default.yml',
    preampConfigFile: null,
  },
  'GET /api/hardware/camilla/configs': { configs: CAMILLA_CONFIGS },
  'GET /api/hardware/camilla/configs/default': { fileName: 'beatnik_default.yml' },
  'GET /api/hardware/camilla/preamp/configs': { configs: [] },
  'GET /api/hardware/camilla/preamp/configs/default': { fileName: null },
};

/** Fallback for POST/PUT actions (restart, update, apply, ...). */
export const BEATNIK_API_OK = { success: true, status: 'ok', message: 'OK' };

// ---------------------------------------------------------------------------
// CamillaDSP

export const CAMILLA_CONFIG = {
  description: 'Beatnik default',
  devices: {
    samplerate: 44100,
    chunksize: 1024,
    capture: { type: 'Stdin', channels: 2, format: 'S16LE' },
    playback: { type: 'Alsa', channels: 2, device: 'hw:sndrpihifiberry', format: 'S32LE' },
  },
  filters: {
    Bass: { type: 'Biquad', parameters: { type: 'Lowshelf', freq: 100, q: 0.7, gain: 3 } },
    Treble: { type: 'Biquad', parameters: { type: 'Highshelf', freq: 8000, q: 0.7, gain: -1.5 } },
  },
  mixers: {
    Stereo: {
      channels: { in: 2, out: 2 },
      mapping: [
        { dest: 0, sources: [{ channel: 0, gain: 0, inverted: false, mute: false }] },
        { dest: 1, sources: [{ channel: 1, gain: 0, inverted: false, mute: false }] },
      ],
    },
  },
  processors: {
    Compressor: {
      type: 'Compressor',
      description: 'Gentle limiter',
      parameters: {
        channels: 2,
        monitor_channels: [0, 1],
        process_channels: [0, 1],
        attack: 0.025,
        release: 1.0,
        threshold: -20,
        factor: 4,
        makeup_gain: 2,
        soft_clip: true,
        clip_limit: -1,
      },
    },
  },
  pipeline: [
    { type: 'Mixer', name: 'Stereo' },
    { type: 'Filter', channels: [0, 1], names: ['Bass', 'Treble'] },
    { type: 'Processor', name: 'Compressor' },
  ],
};

/** Gentle jitter so the level meters look alive. */
const level = (base) => [base + Math.random() * 2, base - 1 + Math.random() * 2];

/** Reply to one CamillaDSP command, `{ [command]: { result, value } }`. */
export function camillaReply(command) {
  const values = {
    GetState: 'Running',
    GetConfigJson: JSON.stringify(CAMILLA_CONFIG),
    GetConfig: '# yaml omitted in screenshots',
    GetVolume: -6,
    GetUpdateInterval: 100,
    GetClippedSamples: 0,
    GetBufferLevel: 2048,
    GetProcessingLoad: 3.8,
    GetCaptureRate: 44100,
  };
  if (command === 'GetSignalLevelsSinceLast' || command === 'GetSignalLevels') {
    return {
      [command]: {
        result: 'Ok',
        value: {
          capture_rms: level(-20), capture_peak: level(-9),
          playback_rms: level(-23), playback_peak: level(-12),
        },
      },
    };
  }
  return { [command]: { result: 'Ok', value: command in values ? values[command] : null } };
}

// ---------------------------------------------------------------------------
// mDNS

const service = (type, name, hostname, ip, port) => ({
  name, type, domain: 'local.', port, hosts: [ip], hostname: `${hostname}.local.`, txt: {},
});

export const MDNS_SERVICES = {
  '_snapcast._tcp.': [
    service('_snapcast._tcp.', 'Snapcast', 'beatnik-server', '192.168.1.150', 1704),
  ],
  '_beatnik._tcp.': [
    service('_beatnik._tcp.', 'beatnik-server', 'beatnik-server', '192.168.1.150', 3000),
    service('_beatnik._tcp.', 'beatnik-livingroom', 'beatnik-livingroom', '192.168.1.151', 3000),
    service('_beatnik._tcp.', 'beatnik-kitchen', 'beatnik-kitchen', '192.168.1.152', 3000),
    service('_beatnik._tcp.', 'beatnik-terrace-l', 'beatnik-terrace-l', '192.168.1.154', 3000),
  ],
};
