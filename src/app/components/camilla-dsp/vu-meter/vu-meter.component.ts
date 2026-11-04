import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

interface VuTick {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    labelX: number;
    labelY: number;
    label: string;
    red: boolean;
}

const MIN_DB = -60;
const MAX_DB = 0;
const RED_ZONE_DB = -6;
const MIN_ANGLE = -50;
const MAX_ANGLE = 50;
const PIVOT_X = 100;
const PIVOT_Y = 114;
const RADIUS = 92;
const INNER_RADIUS = 76;
const CLIP_DB = -1;

function dbToAngle(db: number): number {
    const clamped = Math.min(MAX_DB, Math.max(MIN_DB, Number.isFinite(db) ? db : MIN_DB));
    return MIN_ANGLE + ((clamped - MIN_DB) / (MAX_DB - MIN_DB)) * (MAX_ANGLE - MIN_ANGLE);
}

function polar(angleDeg: number, radius: number): { x: number; y: number } {
    const rad = (angleDeg * Math.PI) / 180;
    return { x: PIVOT_X + radius * Math.sin(rad), y: PIVOT_Y - radius * Math.cos(rad) };
}

function arcPath(fromDb: number, toDb: number, radius: number): string {
    const start = polar(dbToAngle(fromDb), radius);
    const end = polar(dbToAngle(toDb), radius);
    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 0 1 ${end.x} ${end.y}`;
}

function buildTicks(values: number[], radius: number, labelOf: (db: number) => string,
    isRed: (db: number) => boolean, outward: boolean): VuTick[] {
    return values.map(db => {
        const angle = dbToAngle(db);
        const a = polar(angle, radius);
        const b = polar(angle, radius + (outward ? 5 : -5));
        const l = polar(angle, radius + (outward ? 12 : -11));
        return { x1: a.x, y1: a.y, x2: b.x, y2: b.y, labelX: l.x, labelY: l.y, label: labelOf(db), red: isRed(db) };
    });
}

@Component({
    selector: 'app-vu-meter',
    templateUrl: './vu-meter.component.html',
    styleUrls: ['./vu-meter.component.scss'],
    // changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class VuMeterComponent {

    @Input() label = '';
    @Input() rms = MIN_DB;
    @Input() peak = MIN_DB;

    readonly pivotX = PIVOT_X;
    readonly pivotY = PIVOT_Y;
    readonly scalePath = arcPath(MIN_DB, RED_ZONE_DB, RADIUS);
    readonly redPath = arcPath(RED_ZONE_DB, MAX_DB, RADIUS);
    readonly innerPath = arcPath(MIN_DB, MAX_DB, INNER_RADIUS);

    readonly ticks: VuTick[] = buildTicks([-60, -50, -40, -30, -20, -10, -6, -3, 0], RADIUS,
        db => String(db), db => db >= RED_ZONE_DB, true);

    readonly innerTicks: VuTick[] = buildTicks([-60, -48, -36, -24, -12, 0], INNER_RADIUS,
        db => String(Math.round(((db - MIN_DB) / (MAX_DB - MIN_DB)) * 100)), () => false, false);

    readonly coverRadius = 10;

    get needleAngle(): number {
        return dbToAngle(this.rms);
    }

    // Fixed-width "-06.3" style text; silence/invalid clamps to the scale floor.
    get peakText(): string {
        return this.formatDb(this.peak);
    }

    private formatDb(db: number): string {
        const value = Number.isFinite(db) ? Math.max(MIN_DB, db) : MIN_DB;
        const abs = Math.abs(value).toFixed(1).padStart(4, '0');
        return `${value < 0 ? '-' : '+'}${abs}`;
    }

    get rmsText(): string {
        return this.formatDb(this.rms);
    }

    get isClipping(): boolean {
        return this.peak >= CLIP_DB;
    }
}
