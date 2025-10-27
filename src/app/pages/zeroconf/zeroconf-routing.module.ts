import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ZeroconfPage } from './zeroconf.page';

const routes: Routes = [
  {
    path: '',
    component: ZeroconfPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ZeroconfPageRoutingModule {}
