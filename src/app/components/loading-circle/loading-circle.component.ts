import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-loading-circle',
  templateUrl: './loading-circle.component.html',
  styleUrls: ['./loading-circle.component.scss'],
  standalone: false,
})
export class LoadingCircleComponent implements OnInit {
  @Input() isPulsing: boolean = true;
  @Input() icon: string = 'radio';

  constructor() {}

  ngOnInit() {}
}
