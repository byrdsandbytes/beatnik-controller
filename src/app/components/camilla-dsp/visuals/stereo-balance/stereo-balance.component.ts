import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { SignalLevels } from 'src/app/model/camilla-dsp.model';
import { formatDb, toDb } from '../level-utils';

const MAX_BALANCE_DB = 12;
const MAX_SPREAD_DB = 12;
const MAX_ANGLE = 60;
const CX = 100;
const CY = 70;
const RADIUS = 80;
const INNER_RADIUS = 66;
const IMBALANCE_LAMP_DB = 6;
const SMOOTHING = 0.25;

interface BalanceTick {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  labelX: number;
  labelY: number;
  label: string;
  red: boolean;
}

function point(balance: number, radius: number): { x: number; y: number } {
  const angle = (balance * MAX_ANGLE * Math.PI) / 180;
  return { x: CX + radius * Math.sin(angle), y: CY - radius * Math.cos(angle) };
}

function arc(from: number, to: number, radius: number): string {
  const a = point(from, radius);
  const b = point(to, radius);
  return `M ${a.x} ${a.y} A ${radius} ${radius} 0 0 1 ${b.x} ${b.y}`;
}

function buildTicks(): BalanceTick[] {
  return [-12, -6, -3, 0, 3, 6, 12].map(db => {
    const balance = db / MAX_BALANCE_DB;
    const a = point(balance, RADIUS);
    const b = point(balance, RADIUS + 5);
    const l = point(balance, RADIUS + 12);
    const label = db === 0 ? '0' : String(Math.abs(db));
    return { x1: a.x, y1: a.y, x2: b.x, y2: b.y, labelX: l.x, labelY: l.y, label, red: Math.abs(db) >= IMBALANCE_LAMP_DB };
  });
}

@Component({
  selector: 'app-stereo-balance',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
  templateUrl: './stereo-balance.component.html',
  styleUrls: ['./stereo-balance.component.scss']
})
export class StereoBalanceComponent {
  readonly pivotX = CX;
  readonly pivotY = CY;
  readonly needleLength = RADIUS + 2;
  readonly scalePath = arc(-1, 1, RADIUS);
  readonly redLeftPath = arc(-1, -IMBALANCE_LAMP_DB / MAX_BALANCE_DB, RADIUS);
  readonly redRightPath = arc(IMBALANCE_LAMP_DB / MAX_BALANCE_DB, 1, RADIUS);
  readonly innerPath = arc(-1, 1, INNER_RADIUS);
  readonly coverPath = `M ${CX - 12} ${CY} A 12 12 0 0 1 ${CX + 12} ${CY} Z`;
  readonly ticks = buildTicks();

  needleAngle = 0;
  spreadPath = '';
  diff = 0;
  spread = 0;
  imbalanced = false;
  fmt = formatDb;

  private balance = 0;

  // The needle follows the RMS difference; the inner band widens with the peak difference between channels
  @Input() set levels(levels: SignalLevels | null) {
    if (!levels) {
      return;
    }
    const rmsDiff = toDb(levels.playback_rms[1]) - toDb(levels.playback_rms[0]);
    const peakDiff = Math.abs(toDb(levels.playback_peak[1]) - toDb(levels.playback_peak[0]));
    // Gentle smoothing so the needle does not jitter with every poll
    this.diff += (rmsDiff - this.diff) * SMOOTHING;
    this.spread += (peakDiff - this.spread) * SMOOTHING;

    this.balance = Math.max(-1, Math.min(1, this.diff / MAX_BALANCE_DB));
    this.needleAngle = this.balance * MAX_ANGLE;
    const half = 0.04 + Math.min(1, this.spread / MAX_SPREAD_DB) * 0.4;
    this.spreadPath = arc(Math.max(-1, this.balance - half), Math.min(1, this.balance + half), INNER_RADIUS);
    this.imbalanced = Math.abs(this.diff) >= IMBALANCE_LAMP_DB;
  }
}
