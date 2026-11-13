import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RotaryKnobComponent } from './rotary-knob.component';

@NgModule({
  imports: [
    CommonModule
  ],
  declarations: [RotaryKnobComponent],
  exports: [RotaryKnobComponent]
})
export class RotaryKnobModule {}
