import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

export interface DspHealth {
  clippedSamples: number | null;
  bufferLevel: number | null;
  processingLoad: number | null;
  sampleRate: number | null;
}

@Component({
  selector: 'app-dsp-health-strip',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
  templateUrl: './dsp-health-strip.component.html',
  styleUrls: ['./dsp-health-strip.component.scss']
})
export class DspHealthStripComponent {
  @Input() health: DspHealth | null = null;
}
