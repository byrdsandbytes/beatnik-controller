import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { BleWifiProvisioningPageRoutingModule } from './ble-wifi-provisioning-routing.module';

import { BleWifiProvisioningPage } from './ble-wifi-provisioning.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    BleWifiProvisioningPageRoutingModule
  ],
  declarations: [BleWifiProvisioningPage]
})
export class BleWifiProvisioningPageModule {}
