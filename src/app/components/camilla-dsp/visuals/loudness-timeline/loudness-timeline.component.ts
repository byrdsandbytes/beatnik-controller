import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { SignalLevels } from 'src/app/model/camilla-dsp.model';
import { dbFraction, formatDb, RED_ZONE_DB, scaleTicks, toDb } from '../level-utils';

const WIDTH = 240;
const HEIGHT = 100;
const SAMPLE_INTERVAL_MS = 250;
const WINDOW_SECONDS = 60;
const MAX_POINTS = (WINDOW_SECONDS * 1000) / SAMPLE_INTERVAL_MS;
const CREST_WINDOW = 40;

@Component({
  selector: 'app-loudness-timeline',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
  templateUrl: './loudness-timeline.component.html',
  styleUrls: ['./loudness-timeline.component.scss']
})
export class LoudnessTimelineComponent {
  readonly width = WIDTH;
  readonly height = HEIGHT;
  readonly windowSeconds = WINDOW_SECONDS;
  readonly axis = scaleTicks([-60, -40, -20, -10, -6, 0]);
  readonly gridLines = this.axis.map(t => HEIGHT - (t.pos / 100) * HEIGHT);
  readonly redHeight = HEIGHT - dbFraction(RED_ZONE_DB) * HEIGHT;
  fmt = formatDb;

  rmsArea = '';
  peakLine = '';
  crest = 0;

  private samples: { rms: number; peak: number }[] = [];
  private lastSampleAt = 0;

  @Input() set levels(levels: SignalLevels | null) {
    const now = Date.now();
    if (!levels || now - this.lastSampleAt < SAMPLE_INTERVAL_MS) {
      return;
    }
    this.lastSampleAt = now;
    this.samples.push({
      rms: Math.max(...levels.playback_rms.map(toDb)),
      peak: Math.max(...levels.playback_peak.map(toDb))
    });
    if (this.samples.length > MAX_POINTS) {
      this.samples.shift();
    }
    this.rebuild();
  }

  private rebuild(): void {
    const step = WIDTH / (MAX_POINTS - 1);
    const xOf = (i: number) => WIDTH - (this.samples.length - 1 - i) * step;
    const yOf = (db: number) => HEIGHT - dbFraction(db) * HEIGHT;

    const rmsPoints = this.samples.map((s, i) => `${xOf(i)},${yOf(s.rms)}`);
    const first = xOf(0);
    this.rmsArea = `M ${first},${HEIGHT} L ${rmsPoints.join(' L ')} L ${WIDTH},${HEIGHT} Z`;
    this.peakLine = `M ${this.samples.map((s, i) => `${xOf(i)},${yOf(s.peak)}`).join(' L ')}`;

    const recent = this.samples.slice(-CREST_WINDOW);
    this.crest = recent.reduce((sum, s) => sum + (s.peak - s.rms), 0) / recent.length;
  }
}
