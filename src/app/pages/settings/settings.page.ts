import { Component, OnInit } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { UserPreference } from '../../enum/user-preference.enum';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
  standalone: false
})
export class SettingsPage implements OnInit {

  userName?: string
  serverUrl?: string

  

  constructor() { }

  ngOnInit() {
    this.getUserPreferences();
  }

  getUserPreferences() {
    Preferences.get({ key: UserPreference.USERNAME }).then((result) => {
      this.userName = result.value;
    });

    Preferences.get({ key: UserPreference.SERVER_URL }).then((result) => {
      this.serverUrl = result.value;
    });
  }

  setUserName() {
    Preferences.set({
      key: UserPreference.USERNAME,
      value: this.userName || '',
    }).then(() => {
      console.log('Username set to:', this.userName);
    });
  }

  setServerUrl() {
    Preferences.set({
      key: UserPreference.SERVER_URL,
      value: this.serverUrl || '',
    }).then(() => {
      console.log('Server URL set to:', this.serverUrl);
    });
  }
}
