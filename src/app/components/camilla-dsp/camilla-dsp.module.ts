import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { CamillaDspComponent } from './camilla-dsp.component';
import { VuMeterModule } from './vu-meter/vu-meter.module';
import { SignalLevelBarsModule } from './signal-level-bars/signal-level-bars-module';
import { RotaryKnobModule } from './rotary-knob/rotary-knob.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    VuMeterModule,
    SignalLevelBarsModule,
    RotaryKnobModule
  ],
  declarations: [CamillaDspComponent],
  exports: [CamillaDspComponent]
})
export class CamillaDspModule {}
