import { Component, OnInit } from '@angular/core';
import packageJson from '../../../../package.json';
import { SnapcastService } from 'src/app/services/snapcast.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.page.html',
  styleUrls: ['./menu.page.scss'],
  standalone: false
})
export class MenuPage implements OnInit {

  version: string = '0.0.0';

  constructor(
    private snapcastService: SnapcastService,
    private router: Router
  ) { }

  ngOnInit() {
       this.version = packageJson.version;

  }

  async getVersion() {
    // get version from package.json
  }

  enableDemoMode() {
    this.snapcastService.mockServerState();
    this.router.navigate(['/tabs/dashboard']);
  }

}
