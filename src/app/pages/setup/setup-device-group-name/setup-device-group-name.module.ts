import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { SetupDeviceGroupNamePageRoutingModule } from './setup-device-group-name-routing.module';

import { SetupDeviceGroupNamePage } from './setup-device-group-name.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    SetupDeviceGroupNamePageRoutingModule,
  ],
  declarations: [SetupDeviceGroupNamePage],
})
export class SetupDeviceGroupNamePageModule {}
