import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { GestureController } from '@ionic/angular';
import { SnapcastService } from '../services/snapcast.service';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss'],
  standalone: false,
})
export class TabsPage implements OnInit, AfterViewInit {

  isModalOpen = true;

 

  constructor(private snapcastService: SnapcastService) {}

  ngOnInit(): void {
    this.snapcastService.connect();
    
  }

  ngAfterViewInit() {
  }

 
}
