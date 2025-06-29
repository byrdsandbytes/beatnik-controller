import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { DeviceDetailsPageRoutingModule } from './device-details-routing.module';

import { DeviceDetailsPage } from './device-details.page';
import { SnapcastGroupPreviewModule } from 'src/app/components/snapcast-group-preview/snapcast-group-preview.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    DeviceDetailsPageRoutingModule,
    SnapcastGroupPreviewModule
  ],
  declarations: [DeviceDetailsPage]
})
export class DeviceDetailsPageModule {}
