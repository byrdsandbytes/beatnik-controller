import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { DriverMapComponent } from './driver-map.component';

@NgModule({
  imports: [CommonModule, IonicModule],
  declarations: [DriverMapComponent],
  exports: [DriverMapComponent]
})
export class DriverMapModule {}
