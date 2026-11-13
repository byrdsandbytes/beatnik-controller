import { ChangeDetectionStrategy, ChangeDetectorRef, Component, forwardRef, Input } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

interface KnobTick {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
}

const MIN_ANGLE = -135;
const MAX_ANGLE = 135;
const CENTER = 50;
const TICK_COUNT = 11;
const DRAG_PIXELS_FOR_FULL_RANGE = 160;

function polar(angleDeg: number, radius: number): { x: number; y: number } {
    const rad = (angleDeg * Math.PI) / 180;
    return { x: CENTER + radius * Math.sin(rad), y: CENTER - radius * Math.cos(rad) };
}

@Component({
    selector: 'app-rotary-knob',
    templateUrl: './rotary-knob.component.html',
    styleUrls: ['./rotary-knob.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [{
        provide: NG_VALUE_ACCESSOR,
        useExisting: forwardRef(() => RotaryKnobComponent),
        multi: true
    }],
    standalone: false
})
export class RotaryKnobComponent implements ControlValueAccessor {

    @Input() label = '';
    @Input() unit = 'dB';
    @Input() min = -12;
    @Input() max = 12;
    @Input() step = 1;
    @Input() digits = '1.0-1';

    value = 0;
    disabled = false;

    readonly ticks: KnobTick[] = Array.from({ length: TICK_COUNT }, (_, i) => {
        const angle = MIN_ANGLE + (i / (TICK_COUNT - 1)) * (MAX_ANGLE - MIN_ANGLE);
        const outer = polar(angle, 46);
        const inner = polar(angle, 40);
        return { x1: inner.x, y1: inner.y, x2: outer.x, y2: outer.y };
    });

    private dragStartY = 0;
    private dragStartValue = 0;
    private onChange: (value: number) => void = () => { };
    private onTouched: () => void = () => { };

    constructor(private changeDetector: ChangeDetectorRef) { }

    get angle(): number {
        const range = this.max - this.min;
        const ratio = range === 0 ? 0 : (this.value - this.min) / range;
        return MIN_ANGLE + Math.min(1, Math.max(0, ratio)) * (MAX_ANGLE - MIN_ANGLE);
    }

    writeValue(value: number | null): void {
        this.value = this.clamp(Number(value ?? this.min));
        this.changeDetector.markForCheck();
    }

    registerOnChange(fn: (value: number) => void): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: () => void): void {
        this.onTouched = fn;
    }

    setDisabledState(isDisabled: boolean): void {
        this.disabled = isDisabled;
        this.changeDetector.markForCheck();
    }

    onPointerDown(event: PointerEvent) {
        if (this.disabled) {
            return;
        }

        (event.currentTarget as Element).setPointerCapture(event.pointerId);
        this.dragStartY = event.clientY;
        this.dragStartValue = this.value;
        event.preventDefault();
    }

    onPointerMove(event: PointerEvent) {
        if (this.disabled || !(event.currentTarget as Element).hasPointerCapture(event.pointerId)) {
            return;
        }

        const deltaRatio = (this.dragStartY - event.clientY) / DRAG_PIXELS_FOR_FULL_RANGE;
        this.update(this.dragStartValue + deltaRatio * (this.max - this.min));
    }

    onPointerUp(event: PointerEvent) {
        const element = event.currentTarget as Element;
        if (element.hasPointerCapture(event.pointerId)) {
            element.releasePointerCapture(event.pointerId);
        }
        this.onTouched();
    }

    onKeydown(event: KeyboardEvent) {
        if (this.disabled) {
            return;
        }

        const keyDeltas: Record<string, number> = {
            ArrowUp: this.step,
            ArrowRight: this.step,
            ArrowDown: -this.step,
            ArrowLeft: -this.step,
            PageUp: this.step * 5,
            PageDown: -this.step * 5
        };

        if (event.key === 'Home') {
            this.update(this.min);
        } else if (event.key === 'End') {
            this.update(this.max);
        } else if (event.key in keyDeltas) {
            this.update(this.value + keyDeltas[event.key]);
        } else {
            return;
        }

        event.preventDefault();
    }

    private update(rawValue: number) {
        const next = this.clamp(rawValue);
        if (next === this.value) {
            return;
        }

        this.value = next;
        this.onChange(next);
        this.changeDetector.markForCheck();
    }

    private clamp(value: number): number {
        const stepped = Math.round((value - this.min) / this.step) * this.step + this.min;
        const decimals = (String(this.step).split('.')[1] ?? '').length;
        return Number(Math.min(this.max, Math.max(this.min, stepped)).toFixed(decimals));
    }
}
