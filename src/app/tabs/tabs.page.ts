import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { GestureController, ModalController } from '@ionic/angular';
import { SnapcastService } from '../services/snapcast.service';
import { PlayerToolbarComponent } from '../components/player-toolbar/player-toolbar.component';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss'],
  standalone: false,
})
export class TabsPage implements OnInit, AfterViewInit {

  isModalOpen:boolean = false;



  constructor(
    private modalController: ModalController) { }

  ngOnInit(): void {
    // this.createPlayerModal();

  }

  ionViewWillEnter() {
    this.createPlayerModal();
  }


  ionViewWillLeave() {
    console.log('ionViewWillLeave');
    // this.snapcastService.disconnect();
    this.isModalOpen = false;
    this.modalController.dismiss();
    console.log('Modal closed');
  }

  ngAfterViewInit() {
  }

  async createPlayerModal() {
    const modal = await this.modalController.create({
      component: PlayerToolbarComponent,
      cssClass: 'player-modal',
      animated: false,
      keyboardClose: true,
      showBackdrop: false,
      backdropDismiss: false,
      initialBreakpoint: 0.25,
      breakpoints: [0.05, 0.25, 0.5, 0.75],
      backdropBreakpoint: 0.75,

    });
    await modal.present();
    this.isModalOpen = true;
  }


}
