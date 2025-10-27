import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { CamillaDspPage } from './camilla-dsp.page';

const routes: Routes = [
  {
    path: '',
    component: CamillaDspPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CamillaDspPageRoutingModule {}
