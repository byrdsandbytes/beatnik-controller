import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./tabs/tabs.module').then(m => m.TabsPageModule)
  },
  {
    path: 'streams',
    loadChildren: () => import('./pages/streams/streams.module').then( m => m.StreamsPageModule)
  },
  {
    path: 'dashboard',
    loadChildren: () => import('./pages/dashboard/dashboard.module').then( m => m.DashboardPageModule)
  },
  {
    path: 'server-status',
    loadChildren: () => import('./pages/server-status/server-status.module').then( m => m.ServerStatusPageModule)
  },
  {
    path: 'stream-details',
    loadChildren: () => import('./pages/streams/stream-details/stream-details.module').then( m => m.StreamDetailsPageModule)
  },
 
];
@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}
