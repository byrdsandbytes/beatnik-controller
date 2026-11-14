import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { LoudnessTimelineComponent } from './loudness-timeline.component';

@NgModule({
  imports: [CommonModule, IonicModule],
  declarations: [LoudnessTimelineComponent],
  exports: [LoudnessTimelineComponent]
})
export class LoudnessTimelineModule {}
