import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { SetupSoundcardPageRoutingModule } from './setup-soundcard-routing.module';

import { SetupSoundcardPage } from './setup-soundcard.page';
import { LoadingCircleModule } from 'src/app/components/loading-circle/loading-circle.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    SetupSoundcardPageRoutingModule,
    LoadingCircleModule,
  ],
  declarations: [SetupSoundcardPage],
})
export class SetupSoundcardPageModule {}
