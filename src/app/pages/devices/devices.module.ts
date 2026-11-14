import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { DevicesPageRoutingModule } from './devices-routing.module';

import { DevicesPage } from './devices.page';
import { SnapcastGroupPreviewModule } from 'src/app/components/snapcast-group-preview/snapcast-group-preview.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    SnapcastGroupPreviewModule,
    DevicesPageRoutingModule
  ],
  declarations: [DevicesPage]
})
export class DevicesPageModule {}
