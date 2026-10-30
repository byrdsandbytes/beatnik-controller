import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { CamillaDspComponent } from './camilla-dsp.component';
import { VuMeterModule } from './vu-meter/vu-meter.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    VuMeterModule
  ],
  declarations: [CamillaDspComponent],
  exports: [CamillaDspComponent]
})
export class CamillaDspModule {}
