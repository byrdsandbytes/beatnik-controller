import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./tabs/tabs.module').then(m => m.TabsPageModule)
  },

  // {
  //   path: 'dashboard',
  //   loadChildren: () => import('./pages/dashboard/dashboard.module').then( m => m.DashboardPageModule)
  // },
  {
    path: 'server-status',
    loadChildren: () => import('./pages/server-status/server-status.module').then(m => m.ServerStatusPageModule)
  },
  {
    path: 'devices',
    children: [
      {
        path: '',
        loadChildren: () => import('./pages/devices/devices.module').then(m => m.DevicesPageModule)
      },
      {
        path: ':id',
        loadChildren: () => import('./pages/devices/device-details/device-details.module').then(m => m.DeviceDetailsPageModule)
      }
    ]
  },
  {
    path: 'clients',
    children: [
      // {
      //   path: '',
      //   loadChildren: () => import('./pages/clients/clients.module').then( m => m.ClientsPageModule)
      // },
      {
        path: ':id',
        loadChildren: () => import('./pages/clients/client-details/client-details.module').then(m => m.ClientDetailsPageModule)
      }
    ]
  },
  {
    path: 'streams',
    children: [
      {
        path: '',
        loadChildren: () => import('./pages/streams/streams.module').then(m => m.StreamsPageModule)
      },
      {
        path: ':id',
        loadChildren: () => import('./pages/streams/stream-details/stream-details.module').then(m => m.StreamDetailsPageModule)
      }
    ]
  },
  // {
  //   path: 'settings',
  //   loadChildren: () => import('./pages/settings/settings.module').then( m => m.SettingsPageModule)
  // },
  // {
  //   path: 'stream-details',
  //   loadChildren: () => import('./pages/streams/stream-details/stream-details.module').then( m => m.StreamDetailsPageModule)
  // },
  // {
  //   path: 'menu',
  //   loadChildren: () => import('./pages/menu/menu.module').then( m => m.MenuPageModule)
  // },

];
@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
