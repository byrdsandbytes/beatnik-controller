import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { StreamsPage } from './streams.page';

const routes: Routes = [
  {
    path: '',
    component: StreamsPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class StreamsPageRoutingModule {}
