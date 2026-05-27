import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SnapcastStreamPreviewComponent } from './snapcast-stream-preview.component';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';



@NgModule({
  declarations: [
    SnapcastStreamPreviewComponent
  ],
  imports: [
    CommonModule,
    IonicModule,
    RouterModule
  ],
  exports: [
    SnapcastStreamPreviewComponent
  ],
})
export class SnapcastStreamPreviewModule { }
