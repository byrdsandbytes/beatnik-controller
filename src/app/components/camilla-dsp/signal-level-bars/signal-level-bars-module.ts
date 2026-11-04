import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { SignalLevelBarsComponent } from './signal-level-bars.component';



@NgModule({
  declarations: [SignalLevelBarsComponent],
  imports: [
    CommonModule,
    IonicModule
  ],
  exports: [SignalLevelBarsComponent],
})
export class SignalLevelBarsModule { }
