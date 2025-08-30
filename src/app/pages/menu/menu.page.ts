import { Component, OnInit } from '@angular/core';
import packageJson from '../../../../package.json';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.page.html',
  styleUrls: ['./menu.page.scss'],
  standalone: false
})
export class MenuPage implements OnInit {

  version: string = '0.0.0';

  constructor() { }

  ngOnInit() {
       this.version = packageJson.version;

  }

  async getVersion() {
    // get version from package.json
  }
  

}
