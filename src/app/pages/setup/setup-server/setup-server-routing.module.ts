import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SetupServerPage } from './setup-server.page';

const routes: Routes = [
  {
    path: '',
    component: SetupServerPage,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SetupServerPageRoutingModule {}
