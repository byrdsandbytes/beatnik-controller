import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { LoadingCircleComponent } from './loading-circle.component';



@NgModule({
  declarations: [
    LoadingCircleComponent
  ],
  imports: [
    CommonModule,
    IonicModule
  ],
  exports: [
    LoadingCircleComponent
  ]
})
export class LoadingCircleModule { }
