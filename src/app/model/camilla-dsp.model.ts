export interface CamillaDspConfig {
  title: string | null;
  description: string | null;
  devices: Devices;
  mixers: { [key: string]: Mixer };
  filters: { [key: string]: Filter };
  processors: any;
  pipeline: Pipeline[];
}

export interface Devices {
  samplerate: number;
  chunksize: number;
  queuelimit: number | null;
  silence_threshold: number | null;
  silence_timeout: number | null;
  capture: Capture;
  playback: Playback;
  enable_rate_adjust: boolean | null;
  target_level: number | null;
  adjust_period: number | null;
  resampler: any;
  capture_samplerate: number | null;
  stop_on_rate_change: boolean | null;
  rate_measure_interval: number | null;
  volume_ramp_time: number | null;
}

export interface Capture {
  type: string;
  channels: number;
  device: string;
  format: string;
}

export interface Playback {
  type: string;
  channels: number;
  device: string;
  format: string;
}

export interface Filter {
  type: string;
  description: string | null;
  parameters: BiquadParameters;
}

export interface BiquadParameters {
  type: 'Peaking' | 'Lowshelf' | 'Highshelf';
  freq: number;
  q: number;
  gain: number;
}

export interface Pipeline {
  type: string;
  channel: number;
  names: string[];
  description: string | null;
  bypassed: boolean | null;
}

export interface SignalLevels {
  playback_rms: number[];
  playback_peak: number[];
  capture_rms: number[];
  capture_peak: number[];
}

export interface Mixer {
  description: string | null;
  channels: MixerChannels;
  mapping: MixerMapping[];
}

export interface MixerChannels {
  in: number;
  out: number;
}

export interface MixerMapping {
  dest: number;
  sources: MixerSource[];
  mute: boolean | null;
}

export interface MixerSource {
  channel: number;
  gain: number;
  inverted: boolean | null;
  mute: boolean;
  scale: string | null;
}

