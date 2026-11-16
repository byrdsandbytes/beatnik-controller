import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { DspHealthStripComponent } from './dsp-health-strip.component';

@NgModule({
  imports: [CommonModule, IonicModule],
  declarations: [DspHealthStripComponent],
  exports: [DspHealthStripComponent]
})
export class DspHealthStripModule {}
