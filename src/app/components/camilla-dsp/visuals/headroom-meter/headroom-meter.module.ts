import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { HeadroomMeterComponent } from './headroom-meter.component';

@NgModule({
  imports: [CommonModule, IonicModule],
  declarations: [HeadroomMeterComponent],
  exports: [HeadroomMeterComponent]
})
export class HeadroomMeterModule {}
