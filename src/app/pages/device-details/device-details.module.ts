import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { DeviceDetailsPageRoutingModule } from './device-details-routing.module';

import { DeviceDetailsPage } from './device-details.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    DeviceDetailsPageRoutingModule
  ],
  declarations: [DeviceDetailsPage]
})
export class DeviceDetailsPageModule {}
