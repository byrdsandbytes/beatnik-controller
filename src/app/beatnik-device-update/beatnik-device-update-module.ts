import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { BeatnikDeviceUpdateComponent } from './beatnik-device-update.component';



@NgModule({
  declarations: [
    BeatnikDeviceUpdateComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    IonicModule
  ],
  exports: [
    BeatnikDeviceUpdateComponent
  ]
})
export class BeatnikDeviceUpdateModule { }
