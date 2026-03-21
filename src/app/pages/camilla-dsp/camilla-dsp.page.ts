import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-camilla-dsp-page',
  templateUrl: './camilla-dsp.page.html',
  styleUrls: ['./camilla-dsp.page.scss'],
  standalone: false,
})
export class CamillaDspPage implements OnInit {
  url = 'ws://beatnik-server.local:1234';

  constructor() {}

  ngOnInit() {}
}
