import { Component, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-server-status',
  templateUrl: './server-status.page.html',
  styleUrls: ['./server-status.page.scss'],
  standalone: false
})
export class ServerStatusPage implements OnInit {

  constructor(
    private modalController: ModalController
  ) {
    // this.modalController.dismiss(); // Dismiss the modal when the component is created
   }

  ngOnInit() {
  }

}
