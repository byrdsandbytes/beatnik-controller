import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SnapcastStreamVolumeControlComponent } from './snapcast-stream-volume-control.component';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';



@NgModule({
  declarations: [SnapcastStreamVolumeControlComponent],
  imports: [
    CommonModule,
    IonicModule,
    FormsModule
  ],
  exports: [SnapcastStreamVolumeControlComponent],
})
export class SnapcastStreamVolumeControlModule { }
