import { Component, ElementRef, ViewChild } from '@angular/core';
import { GestureController } from '@ionic/angular';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss'],
  standalone: false,
})
export class TabsPage {

  isModalOpen = true;

 

  constructor(private gestureCtrl: GestureController) {}

  

  ngAfterViewInit() {
  }

 
}
