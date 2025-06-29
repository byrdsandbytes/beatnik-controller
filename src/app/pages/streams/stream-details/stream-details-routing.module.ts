import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { StreamDetailsPage } from './stream-details.page';

const routes: Routes = [
  {
    path: '',
    component: StreamDetailsPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class StreamDetailsPageRoutingModule {}
