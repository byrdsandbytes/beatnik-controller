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
const MIN_ANGLE = -45;
const MAX_ANGLE = 45;
const PIVOT_X = 100;
const PIVOT_Y = 114;
const RADIUS = 95;
const RED_ZONE_DB = -6;
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
    const largeArc = dbToAngle(toDb) - dbToAngle(fromDb) > 180 ? 1 : 0;
    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y}`;
}

const TICK_VALUES = [-60, -40, -30, -20, -10, -6, -3, 0];

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

    readonly ticks: VuTick[] = TICK_VALUES.map(db => {
        const angle = dbToAngle(db);
        const outer = polar(angle, RADIUS + 5);
        const inner = polar(angle, RADIUS - 5);
        const label = polar(angle, RADIUS + 13);
        return {
            x1: inner.x,
            y1: inner.y,
            x2: outer.x,
            y2: outer.y,
            labelX: label.x,
            labelY: label.y,
            label: String(db),
            red: db >= RED_ZONE_DB
        };
    });

    readonly coverPath = `M ${PIVOT_X - 18} 132 L ${PIVOT_X - 18} ${PIVOT_Y + 6} A 18 18 0 0 1 ${PIVOT_X + 18} ${PIVOT_Y + 6} L ${PIVOT_X + 18} 132 Z`;

    readonly endMarks = [
        { label: '-∞', angle: MIN_ANGLE - 8, red: false },
        { label: '×', angle: MAX_ANGLE + 8, red: true }
    ].map(m => {
        const pos = polar(m.angle, RADIUS + 13);
        return { label: m.label, x: pos.x, y: pos.y, red: m.red };
    });

    get needleAngle(): number {
        return dbToAngle(this.rms);
    }

    // Fixed-width "-06.3" style text; silence/invalid clamps to the scale floor.
    get peakText(): string {
        const value = Number.isFinite(this.peak) ? Math.max(MIN_DB, this.peak) : MIN_DB;
        const abs = Math.abs(value).toFixed(1).padStart(4, '0');
        return `${value < 0 ? '-' : '+'}${abs}`;
    }

    get isClipping(): boolean {
        return this.peak >= CLIP_DB;
    }
}
