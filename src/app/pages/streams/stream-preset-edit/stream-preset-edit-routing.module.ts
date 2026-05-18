import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { StreamPresetEditPage } from './stream-preset-edit.page';

const routes: Routes = [
  {
    path: '',
    component: StreamPresetEditPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class StreamPresetEditPageRoutingModule {}
