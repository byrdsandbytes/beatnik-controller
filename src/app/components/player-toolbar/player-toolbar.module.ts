import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlayerToolbarComponent } from './player-toolbar.component';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';



@NgModule({
  declarations: [
    PlayerToolbarComponent
  ],
  imports: [
    CommonModule,
    IonicModule,
    FormsModule
  ],
  exports: [
    PlayerToolbarComponent
  ]
})
export class PlayerToolbarModule { }
