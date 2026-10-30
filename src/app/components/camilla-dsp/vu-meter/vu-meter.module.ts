import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { VuMeterComponent } from './vu-meter.component';

@NgModule({
  imports: [
    CommonModule,
    IonicModule
  ],
  declarations: [VuMeterComponent],
  exports: [VuMeterComponent]
})
export class VuMeterModule {}
