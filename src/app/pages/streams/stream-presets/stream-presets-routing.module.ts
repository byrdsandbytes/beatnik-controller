import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { StreamPresetsPage } from './stream-presets.page';

const routes: Routes = [
  {
    path: '',
    component: StreamPresetsPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class StreamPresetsPageRoutingModule {}
