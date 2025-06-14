import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SnapcastStreamPreviewComponent } from './snapcast-stream-preview.component';
import { IonicModule } from '@ionic/angular';



@NgModule({
  declarations: [
    SnapcastStreamPreviewComponent
  ],
  imports: [
    CommonModule,
    IonicModule
  ],
  exports: [
    SnapcastStreamPreviewComponent
  ],
})
export class SnapcastStreamPreviewModule { }
