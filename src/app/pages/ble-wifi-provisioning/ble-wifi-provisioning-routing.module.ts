import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { BleWifiProvisioningPage } from './ble-wifi-provisioning.page';

const routes: Routes = [
  {
    path: '',
    component: BleWifiProvisioningPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class BleWifiProvisioningPageRoutingModule {}
