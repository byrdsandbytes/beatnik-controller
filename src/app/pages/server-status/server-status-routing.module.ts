import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ServerStatusPage } from './server-status.page';

const routes: Routes = [
  {
    path: '',
    component: ServerStatusPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ServerStatusPageRoutingModule {}
