import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SetupSoundcardPage } from './setup-soundcard.page';

const routes: Routes = [
  {
    path: '',
    component: SetupSoundcardPage,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SetupSoundcardPageRoutingModule {}
