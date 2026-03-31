import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { ChooseSpeakersComponent } from './choose-speakers.component';



@NgModule({
  declarations: [
    ChooseSpeakersComponent
  ],
  imports: [
    CommonModule,
    IonicModule,
    FormsModule,
  ],
  exports: [
    ChooseSpeakersComponent
  ]
})
export class ChooseSpeakersModule { }
