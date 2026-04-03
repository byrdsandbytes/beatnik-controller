import { Component, Input, OnInit } from '@angular/core';
import { Group } from '../model/snapcast.model';

@Component({
  selector: 'app-client-name',
  templateUrl: './client-name.component.html',
  styleUrls: ['./client-name.component.scss'],
  standalone: false
})
export class ClientNameComponent  implements OnInit {

  @Input() group: Group;

  constructor() { }

  ngOnInit() {}

}
