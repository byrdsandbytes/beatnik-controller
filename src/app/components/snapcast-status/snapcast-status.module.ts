import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SnapcastStatusComponent } from './snapcast-status.component';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { SwiperModule } from 'swiper/angular';



@NgModule({
  declarations: [SnapcastStatusComponent],
  imports: [
    CommonModule,
    IonicModule,
    FormsModule,
    SwiperModule
  ],
  exports: [SnapcastStatusComponent],
})
export class SnapcastStatusModule { }
