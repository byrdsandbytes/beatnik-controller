import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./tabs/tabs.module').then(m => m.TabsPageModule)
  },
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
  {
    path: 'menu',
    children: [
      {
        path: '',
        loadChildren: () => import('./pages/menu/menu.module').then(m => m.MenuPageModule)
      },



      // {
      //   path: 'about',
      //   loadChildren: () => import('./pages/about/about.module').then(m => m.AboutPageModule)
      // }

    ]
  },
  {
    path: 'settings',
    loadChildren: () => import('./pages/settings/settings.module').then(m => m.SettingsPageModule)
  },


];
@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
