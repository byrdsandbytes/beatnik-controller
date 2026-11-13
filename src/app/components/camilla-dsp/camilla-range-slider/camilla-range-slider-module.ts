import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { CamillaRangeSliderComponent } from './camilla-range-slider.component';



@NgModule({
  declarations: [CamillaRangeSliderComponent],
  imports: [
    CommonModule,
    IonicModule
  ],
  exports: [CamillaRangeSliderComponent]
})
export class CamillaRangeSliderModule { }
