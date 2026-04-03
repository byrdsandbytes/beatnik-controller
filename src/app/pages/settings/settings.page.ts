import { Component, OnInit } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { UserPreference } from '../../enum/user-preference.enum';
import { SnapcastService } from 'src/app/services/snapcast.service';
import { AlertController, LoadingController, ToastController } from '@ionic/angular';
import { result } from 'lodash-es';
import { firstValueFrom, timeout } from 'rxjs';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
  standalone: false
})
export class SettingsPage implements OnInit {

  userName?: string
  serverUrl?: string



  constructor(
    private snapcastService: SnapcastService,
    private loadingController: LoadingController,
    private toastController: ToastController,
    private alertController: AlertController
  ) { }

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

  async connectToServer() {
    // Logic to connect to the server using the serverUrl
    console.log('Connecting to server at:', this.serverUrl);

    // show loading indicator
    const loading = await this.loadingController.create({
      message: 'Establishing connection to server...',
    });
    await loading.present();

    try {
      // Disconnect first to clean up any existing or stalled connections
      if (this.snapcastService.disconnect) {
        this.snapcastService.disconnect();
        // Brief delay to ensure cleanup
        await new Promise(resolve => setTimeout(resolve, 5500));
      }

      try {
        const connectionResult = await this.snapcastService.connect(this.serverUrl!);
        console.log('Connection result:', connectionResult);
        loading.message = 'Connected to server, verifying status...';
        await new Promise(resolve => setTimeout(resolve, 5500));

      } catch (error) {
        console.error('Error during connection attempt:', error);
        throw error; // Rethrow to be caught by outer catch
      }

      try {
        loading.message = 'Retrieving server status...';
        const status = await firstValueFrom(this.snapcastService.getServerStatus().pipe(timeout(5000)));
        console.log('Successfully connected to server', status);
      } catch (error) {
        console.error('Failed to get server status after connection:', error);
        throw new Error('Connected to server but failed to retrieve status. Please check the server and try again.');
      }

      // get server status to verify connection
      // const status = await firstValueFrom(this.snapcastService.getServerStatus());
      // console.log('Successfully connected to server', status);

      const toast = await this.toastController.create({
        message: 'Successfully connected to server',
        duration: 2000,
        color: 'success'
      });
      await toast.present();
    } catch (error) {
      console.error('Failed to connect to server:', error);
      const alert = await this.alertController.create({
        header: 'Connection Failed',
        message: 'Failed to connect to server. Please check the URL and try again.',
        buttons: ['OK']
      });
      await alert.present();
    } finally {
      loading.dismiss();
    }
  }
}


