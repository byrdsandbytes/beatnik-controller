import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClientNameComponent } from './client-name.component';



@NgModule({
  declarations: [
    ClientNameComponent
  ],
  imports: [
    CommonModule
  ],
  exports: [
    ClientNameComponent
  ]
})
export class ClientNameModule { }
