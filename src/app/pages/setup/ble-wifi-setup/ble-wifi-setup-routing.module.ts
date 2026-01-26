import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { BleWifiSetupPage } from './ble-wifi-setup.page';

const routes: Routes = [
  {
    path: '',
    component: BleWifiSetupPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class BleWifiSetupPageRoutingModule {}
