import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { BeatnikUpdatePage } from './beatnik-update.page';

const routes: Routes = [
  {
    path: '',
    component: BeatnikUpdatePage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class BeatnikUpdatePageRoutingModule {}
