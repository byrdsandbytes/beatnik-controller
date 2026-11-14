import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { CamillaDspComponent } from './camilla-dsp.component';
import { VuMeterModule } from './vu-meter/vu-meter.module';
import { SignalLevelBarsModule } from './signal-level-bars/signal-level-bars-module';
import { CamillaRangeSliderModule } from './camilla-range-slider/camilla-range-slider-module';
import { DriverMapModule } from './visuals/driver-map/driver-map.module';
import { DspHealthStripModule } from './visuals/dsp-health-strip/dsp-health-strip.module';
import { HeadroomMeterModule } from './visuals/headroom-meter/headroom-meter.module';
import { LoudnessTimelineModule } from './visuals/loudness-timeline/loudness-timeline.module';
import { RadialGaugesModule } from './visuals/radial-gauges/radial-gauges.module';
import { StereoBalanceModule } from './visuals/stereo-balance/stereo-balance.module';
import { RotaryKnobModule } from './rotary-knob/rotary-knob.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    VuMeterModule,
    SignalLevelBarsModule,
    DriverMapModule,
    DspHealthStripModule,
    HeadroomMeterModule,
    LoudnessTimelineModule,
    RadialGaugesModule,
    StereoBalanceModule,
    RotaryKnobModule,
    CamillaRangeSliderModule
  ],
  declarations: [CamillaDspComponent],
  exports: [CamillaDspComponent]
})
export class CamillaDspModule {}
