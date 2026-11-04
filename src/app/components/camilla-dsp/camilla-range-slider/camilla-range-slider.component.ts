import { ChangeDetectionStrategy, ChangeDetectorRef, Component, forwardRef, Input } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-camilla-range-slider',
  templateUrl: './camilla-range-slider.component.html',
  styleUrls: ['./camilla-range-slider.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => CamillaRangeSliderComponent),
    multi: true
  }],
  standalone: false
})
export class CamillaRangeSliderComponent implements ControlValueAccessor {

  @Input() min = -12;
  @Input() max = 12;
  @Input() step = 1;
  @Input() ticks = true;
  @Input() snaps = true;

  value = 0;
  disabled = false;

  private onChange: (value: number) => void = () => { };
  private onTouched: () => void = () => { };

  constructor(private changeDetector: ChangeDetectorRef) { }

  onRangeChange(event: Event): void {
    const value = Number((event as CustomEvent).detail.value);
    if (value === this.value) {
      return;
    }
    this.value = value;
    this.onChange(value);
    this.onTouched();
  }

  writeValue(value: number | null): void {
    this.value = Number.isFinite(value) ? (value as number) : this.min;
    this.changeDetector.markForCheck();
  }

  registerOnChange(fn: (value: number) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(disabled: boolean): void {
    this.disabled = disabled;
    this.changeDetector.markForCheck();
  }
}
