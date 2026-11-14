import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-full-scrren-dsp',
  templateUrl: './full-scrren-dsp.page.html',
  styleUrls: ['./full-scrren-dsp.page.scss'],
  standalone: false
})
export class FullScrrenDspPage {

  url = this.route.snapshot.queryParamMap.get('url') || 'ws://beatnik-server.local:1234';

  constructor(private route: ActivatedRoute) { }

}
