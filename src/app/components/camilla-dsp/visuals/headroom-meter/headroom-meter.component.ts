import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { SignalLevels } from 'src/app/model/camilla-dsp.model';
import { CHANNEL_NAMES, dbFraction, formatDb, RED_ZONE_DB, scaleTicks, toDb } from '../level-utils';

interface HeadroomRow {
  name: string;
  inRms: number;
  inPeak: number;
  outRms: number;
  outPeak: number;
  delta: number;
  headroom: number;
  clipping: boolean;
}

const ATTACK = 0.5;
const RELEASE = 0.08;
const DELTA_SMOOTHING = 0.03;
const GATE_DB = -70;
const PEAK_HOLD_MS = 1500;
const PEAK_FALL_DB_PER_S = 20;

interface PeakHold {
  db: number;
  at: number;
}

interface ChannelState {
  inRms: number;
  outRms: number;
  inPeak: PeakHold;
  outPeak: PeakHold;
  delta: number;
}

function newState(levels: SignalLevels, i: number): ChannelState {
  const now = Date.now();
  return {
    inRms: toDb(levels.capture_rms[i]),
    outRms: toDb(levels.playback_rms[i]),
    inPeak: { db: toDb(levels.capture_peak[i]), at: now },
    outPeak: { db: toDb(levels.playback_peak[i]), at: now },
    delta: 0
  };
}

// Fast attack, slow release so the bars follow the music without flickering
function smooth(previous: number, next: number): number {
  return previous + (next - previous) * (next > previous ? ATTACK : RELEASE);
}

// Holds a peak briefly, then lets it fall back steadily
function holdPeak(held: PeakHold, next: number, now: number, dt: number): PeakHold {
  if (next >= held.db) {
    return { db: next, at: now };
  }
  if (now - held.at < PEAK_HOLD_MS) {
    return held;
  }
  return { db: Math.max(next, held.db - PEAK_FALL_DB_PER_S * dt), at: held.at };
}

@Component({
  selector: 'app-headroom-meter',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
  templateUrl: './headroom-meter.component.html',
  styleUrls: ['./headroom-meter.component.scss']
})
export class HeadroomMeterComponent {
  @Input() volume = 0;

  rows: HeadroomRow[] = [];
  levels: SignalLevels | null = null;

  private state: ChannelState[] = [];
  private lastUpdate = 0;

  @Input('levels') set levelsInput(levels: SignalLevels | null) {
    this.levels = levels;
    if (!levels) {
      this.state = [];
      this.rows = [];
      return;
    }
    const now = Date.now();
    const dt = this.lastUpdate ? Math.min(1, (now - this.lastUpdate) / 1000) : 0;
    this.lastUpdate = now;

    this.rows = CHANNEL_NAMES.map((name, i) => {
      const st = this.state[i] ??= newState(levels, i);
      st.inRms = smooth(st.inRms, toDb(levels.capture_rms[i]));
      st.outRms = smooth(st.outRms, toDb(levels.playback_rms[i]));
      st.inPeak = holdPeak(st.inPeak, toDb(levels.capture_peak[i]), now, dt);
      st.outPeak = holdPeak(st.outPeak, toDb(levels.playback_peak[i]), now, dt);
      // Only meaningful while there is signal on both sides; otherwise keep the last value
      if (st.inRms > GATE_DB && st.outRms > GATE_DB) {
        st.delta += (st.outRms - st.inRms - st.delta) * DELTA_SMOOTHING;
      }
      return {
        name,
        inRms: st.inRms, inPeak: st.inPeak.db,
        outRms: st.outRms, outPeak: st.outPeak.db,
        delta: st.delta, headroom: -st.outPeak.db, clipping: st.outPeak.db >= -0.1
      };
    });
  }

  readonly ticks = scaleTicks([-60, -50, -40, -30, -20, -10, -6, -3, 0]);
  readonly redStart = dbFraction(RED_ZONE_DB) * 100;

  frac = dbFraction;
  fmt = formatDb;

  // Part of the bar that lies inside the red zone
  redWidth(db: number): number {
    return Math.max(0, dbFraction(db) * 100 - this.redStart);
  }
}
