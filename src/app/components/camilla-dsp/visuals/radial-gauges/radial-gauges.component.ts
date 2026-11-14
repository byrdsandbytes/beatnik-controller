import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { SignalLevels } from 'src/app/model/camilla-dsp.model';
import { CHANNEL_NAMES, dbFraction, formatDb, RED_ZONE_DB, toDb } from '../level-utils';

const CENTER = 60;
const OUTER_RADIUS = 48;
const INNER_RADIUS = 34;
const SCALE_RADIUS = 56;
const ARC_SHARE = 0.75;
const START_ANGLE = 135;
const CLIP_DB = -1;

interface Ring {
  name: string;
  rms: number;
  rmsDash: string;
  peakDash: string;
  clipping: boolean;
}

interface RingTick {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  labelX: number;
  labelY: number;
  label: string;
  red: boolean;
}

function circumference(radius: number): number {
  return 2 * Math.PI * radius;
}

function dash(radius: number, fraction: number): string {
  return `${circumference(radius) * ARC_SHARE * fraction} ${circumference(radius)}`;
}

function onCircle(fraction: number, radius: number): { x: number; y: number } {
  const angle = ((START_ANGLE + 270 * fraction) * Math.PI) / 180;
  return { x: CENTER + radius * Math.cos(angle), y: CENTER + radius * Math.sin(angle) };
}

const TICKS: RingTick[] = [-60, -40, -20, -10, -6, 0].map(db => {
  const f = dbFraction(db);
  const a = onCircle(f, SCALE_RADIUS);
  const b = onCircle(f, SCALE_RADIUS + 4);
  const l = onCircle(f, SCALE_RADIUS + 10);
  return { x1: a.x, y1: a.y, x2: b.x, y2: b.y, labelX: l.x, labelY: l.y, label: String(db), red: db >= RED_ZONE_DB };
});

@Component({
  selector: 'app-radial-gauges',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
  templateUrl: './radial-gauges.component.html',
  styleUrls: ['./radial-gauges.component.scss']
})
export class RadialGaugesComponent {
  @Input() volume = 0;
  @Input() sampleRate: number | null = null;

  readonly center = CENTER;
  readonly outerRadius = OUTER_RADIUS;
  readonly innerRadius = INNER_RADIUS;
  readonly scaleRadius = SCALE_RADIUS;
  readonly ticks = TICKS;
  readonly scaleDash = dash(SCALE_RADIUS, 1);
  readonly redDash = `${circumference(SCALE_RADIUS) * ARC_SHARE * (1 - dbFraction(RED_ZONE_DB))} ${circumference(SCALE_RADIUS)}`;
  readonly redOffset = -circumference(SCALE_RADIUS) * ARC_SHARE * dbFraction(RED_ZONE_DB);
  readonly trackOuter = dash(OUTER_RADIUS, 1);
  readonly trackInner = dash(INNER_RADIUS, 1);
  fmt = formatDb;

  rings: Ring[] = [];

  @Input() set levels(levels: SignalLevels | null) {
    this.rings = levels ? CHANNEL_NAMES.map((name, i) => {
      const rms = toDb(levels.playback_rms[i]);
      const peak = toDb(levels.playback_peak[i]);
      return {
        name, rms,
        rmsDash: dash(INNER_RADIUS, dbFraction(rms)),
        peakDash: dash(OUTER_RADIUS, dbFraction(peak)),
        clipping: peak >= CLIP_DB
      };
    }) : [];
  }
}
