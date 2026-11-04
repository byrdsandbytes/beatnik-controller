import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { SignalLevels } from '../../../model/camilla-dsp.model';

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

  @Input() set levels(levels: SignalLevels | null) {
    this.groups = levels ? [
      { title: 'Capture (Snapcast)', rms: levels.capture_rms, peak: levels.capture_peak },
      { title: 'Playback', rms: levels.playback_rms, peak: levels.playback_peak }
    ] : [];
  }

  trackByTitle(_: number, group: MeterGroup): string {
    return group.title;
  }

  barHeight(db: number): number {
    return (db + 100) * 2;
  }
}
