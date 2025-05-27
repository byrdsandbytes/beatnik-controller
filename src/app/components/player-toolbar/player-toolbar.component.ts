import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-player-toolbar',
  templateUrl: './player-toolbar.component.html',
  styleUrls: ['./player-toolbar.component.scss'],
  standalone: false
})
export class PlayerToolbarComponent implements OnInit {

  baseIP = '192.168.1.127';

  constructor(
  ) { }

  ngOnInit() { 
    this.getPlayerStatus();
  }

  getPlayerStatus() {
    // this.playerStatusService.getPlayerStatus(this.baseIP)
  }

  setVolume(event:any) {
    const value = event.detail.value;
    console.log(value);
    // this.playerStatusService.setPlayerVolume(this.baseIP, event.detail.value);
  }

}
