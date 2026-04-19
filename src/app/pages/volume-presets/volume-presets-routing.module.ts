import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { VolumePresetsPage } from './volume-presets.page';

const routes: Routes = [
  {
    path: '',
    component: VolumePresetsPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class VolumePresetsPageRoutingModule {}
