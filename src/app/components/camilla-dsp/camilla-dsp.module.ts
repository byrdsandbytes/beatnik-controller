import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { CamillaDspComponent } from './camilla-dsp.component';
import { VuMeterModule } from './vu-meter/vu-meter.module';
import { RotaryKnobModule } from './rotary-knob/rotary-knob.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    VuMeterModule,
    RotaryKnobModule
  ],
  declarations: [CamillaDspComponent],
  exports: [CamillaDspComponent]
})
export class CamillaDspModule {}
