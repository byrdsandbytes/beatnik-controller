import { ChangeDetectionStrategy, Component, HostBinding, Input } from '@angular/core';
import { SignalLevels } from '../../../model/camilla-dsp.model';
import { levelColor } from '../visuals/level-utils';

interface MeterGroup {
  title: string;
  rms: number[];
  peak: number[];
}

@Component({
  selector: 'app-signal-level-bars',
  templateUrl: './signal-level-bars.component.html',
  styleUrls: ['./signal-level-bars.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class SignalLevelBarsComponent {

  readonly channels = ['Left', 'Right'];

  groups: MeterGroup[] = [];

  @Input() @HostBinding('class.kiosk') kiosk = false;

  @Input() set levels(levels: SignalLevels | null) {
    this.groups = levels ? [
      { title: 'Capture (Snapcast)', rms: levels.capture_rms, peak: levels.capture_peak },
      { title: 'Playback', rms: levels.playback_rms, peak: levels.playback_peak }
    ] : [];
  }

  // same zones as the bars: green below -18 dB, yellow from -18 dB, red from -6 dB
  color = levelColor;

  trackByTitle(_: number, group: MeterGroup): string {
    return group.title;
  }

  // percentage of the track; 0 dB fills 200 of the 220px track
  barHeight(db: number): number {
    return Math.min(100, Math.max(0, (db + 100) / 1.1));
  }
}
