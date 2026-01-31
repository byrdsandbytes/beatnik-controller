import { Component, OnInit } from '@angular/core';
import { SUPPORTED_HATS } from 'src/app/constant/hat.constant';

@Component({
  selector: 'app-soundcard-picker',
  templateUrl: './soundcard-picker.component.html',
  styleUrls: ['./soundcard-picker.component.scss'],
  standalone: false
})
export class SoundcardPickerComponent  implements OnInit {

  hats = Object.values(SUPPORTED_HATS);
  filteredHats = this.hats;

  constructor() { }

  ngOnInit() {}

  filterHats(searchTerm: string) {
    if (!searchTerm) {
      this.filteredHats = this.hats;
      return;
    }
    const lowerTerm = searchTerm.toLowerCase();
    this.filteredHats = this.hats.filter(hat =>
      hat.name.toLowerCase().includes(lowerTerm) ||
      hat.id.toLowerCase().includes(lowerTerm)
    );
  }

}
