import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { VolumePresetEditPage } from './volume-preset-edit.page';

const routes: Routes = [
  {
    path: '',
    component: VolumePresetEditPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class VolumePresetEditPageRoutingModule {}
