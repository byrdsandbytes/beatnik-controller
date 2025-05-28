import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SnapcastStreamVolumeControlComponent } from './snapcast-stream-volume-control.component';
import { IonicModule } from '@ionic/angular';



@NgModule({
  declarations: [SnapcastStreamVolumeControlComponent],
  imports: [
    CommonModule,
    IonicModule
  ],
  exports: [SnapcastStreamVolumeControlComponent],
})
export class SnapcastStreamVolumeControlModule { }
