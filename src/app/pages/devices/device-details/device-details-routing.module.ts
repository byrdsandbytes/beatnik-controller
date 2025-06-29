import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { DeviceDetailsPage } from './device-details.page';

const routes: Routes = [
  {
    path: '',
    component: DeviceDetailsPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DeviceDetailsPageRoutingModule {}
