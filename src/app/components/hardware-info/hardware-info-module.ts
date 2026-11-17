import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { HardwareInfoComponent } from './hardware-info.component';

@NgModule({
  declarations: [
    HardwareInfoComponent
  ],
  imports: [
    CommonModule,
    IonicModule
  ],
  exports: [
    HardwareInfoComponent
  ]
})
export class HardwareInfoModule { }
