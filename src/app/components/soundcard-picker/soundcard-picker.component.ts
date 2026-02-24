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

  ngOnInit() {
    this.initAndSortHats();
  }

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


  initAndSortHats() {
  //  sort hats by supported by Beatnik first, then by community tested, then hifiberry first, then alphabetically
    this.hats.sort((a, b) => {
      if (a.testedbyBeatnik && !b.testedbyBeatnik) return -1;
      if (!a.testedbyBeatnik && b.testedbyBeatnik) return 1;
      if (a.testedByCommunity && !b.testedByCommunity) return -1;
      if (!a.testedByCommunity && b.testedByCommunity) return 1;
      if (a.id.startsWith('hifiberry') && !b.id.startsWith('hifiberry')) return -1;
      if (!a.id.startsWith('hifiberry') && b.id.startsWith('hifiberry')) return 1;
      return a.name.localeCompare(b.name);
    });
    this.filteredHats = this.hats;
  }

}
