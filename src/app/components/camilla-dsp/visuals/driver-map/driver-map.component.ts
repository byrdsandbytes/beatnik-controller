import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { SignalLevels } from 'src/app/model/camilla-dsp.model';
import { CHANNEL_NAMES, dbFraction, formatDb, toDb } from '../level-utils';

const CLIP_DB = -1;

interface Driver {
  label: string;
  db: number;
  capOpacity: number;
  coneOpacity: number;
  clipping: boolean;
}

@Component({
  selector: 'app-driver-map',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
  templateUrl: './driver-map.component.html',
  styleUrls: ['./driver-map.component.scss']
})
export class DriverMapComponent {
  /** Optional names per playback channel, e.g. ['Tweeter L', 'Tweeter R', 'Woofer L', 'Woofer R', 'Sub'] */
  @Input() labels: string[] = [];

  drivers: Driver[] = [];
  fmt = formatDb;
  private channelLevels: number[] = [];

  @Input() set levels(levels: SignalLevels | null) {
    this.channelLevels = levels ? levels.playback_rms.map(toDb) : [];
    this.drivers = this.channelLevels.map((db, i) => {
      const fraction = dbFraction(db);
      return {
        label: this.labelFor(i),
        db,
        capOpacity: 0.15 + fraction * 0.85,
        coneOpacity: fraction * 0.35,
        clipping: db >= CLIP_DB
      };
    });
  }

  trackByLabel(_: number, driver: Driver): string {
    return driver.label;
  }

  private labelFor(index: number): string {
    if (this.labels[index]) {
      return this.labels[index];
    }
    return this.channelLevels.length === 2 ? CHANNEL_NAMES[index] : `Ch ${index + 1}`;
  }
}
