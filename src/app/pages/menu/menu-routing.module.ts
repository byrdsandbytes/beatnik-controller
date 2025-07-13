import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { MenuPage } from './menu.page';

const routes: Routes = [
  {
    path: '',
    component: MenuPage
  },
  {
    path: 'settings',
    loadChildren: () => import('../settings/settings.module').then(m => m.SettingsPageModule)
  },
  {
    path: 'server-status',
    loadChildren: () => import('../server-status/server-status.module').then(m => m.ServerStatusPageModule)
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class MenuPageRoutingModule {}
