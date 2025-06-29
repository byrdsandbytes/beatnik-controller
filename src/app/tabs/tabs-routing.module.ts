import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TabsPage } from './tabs.page';

const routes: Routes = [
  {
    path: 'tabs',
    component: TabsPage,
    children: [

      {
        path: 'streams',
        children: [
          {
            path: '',
        loadChildren: () => import('../pages/streams/streams.module').then(m => m.StreamsPageModule)
          },
          {
            path: ':id',
            loadChildren: () => import('../pages/streams/stream-details/stream-details.module').then(m => m.StreamDetailsPageModule)
          }
        ]
      },

      {
        path: 'dashboard',
        loadChildren: () => import('../pages/dashboard/dashboard.module').then(m => m.DashboardPageModule)
      },
      {
        path: 'devices',
        children: [
          {
            path: '',
            loadChildren: () => import('../pages/devices/devices.module').then(m => m.DevicesPageModule)
          },
          {
            path: ':id',
            loadChildren: () => import('../pages/devices/device-details/device-details.module').then(m => m.DeviceDetailsPageModule)
          }
        ]
      },

      {
        path: '',
        redirectTo: '/tabs/dashboard',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: '',
    redirectTo: '/tabs/dashboard',
    pathMatch: 'full'
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
})
export class TabsPageRoutingModule { }
