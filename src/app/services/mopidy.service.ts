import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Preferences } from '@capacitor/preferences';
import { UserPreference } from 'src/app/enum/user-preference.enum';
import Mopidy from 'mopidy';

@Injectable({
  providedIn: 'root'
})
export class MopidyService {
  private mopidy: any;
  private currentTrackSubject = new BehaviorSubject<string>('Idle');
  public currentTrack$ = this.currentTrackSubject.asObservable();
  private hostName = 'beatnik-server.local';
  private isOnline = false;

  constructor() {
    this.initMopidy();
  }

  private async initMopidy(): Promise<void> {
    let url = '';
    const result = await Preferences.get({ key: UserPreference.SERVER_URL });
    url = result.value || 'beatnik-server.local';
    
    // remove http:// or https:// from url if present
    const cleanUrl = url.replace(/(^\w+:|^)\/\//, '');

    this.mopidy = new Mopidy({
      webSocketUrl: `ws://${cleanUrl}:6680/mopidy/ws/`
    });

    this.mopidy.on('state:online', () => {
      this.isOnline = true;
      this.fetchCurrentTrack();
    });

    this.mopidy.on('state:offline', () => {
      this.isOnline = false;
    });

    this.mopidy.on('websocket:error', () => {
      this.isOnline = false;
    });
    
    this.mopidy.on('event:trackPlaybackStarted', (event: any) => {
      this.currentTrackSubject.next(event.tl_track.track.name);
    });
  }

  private fetchCurrentTrack() {
    if (this.isOnline && this.mopidy?.playback?.getCurrentTrack) {
      this.mopidy.playback.getCurrentTrack().then((track: any) => {
        this.currentTrackSubject.next(track ? track.name : 'Idle');
      });
    }
  }

  private async ensureConnected(): Promise<void> {
    if (this.isOnline && this.mopidy?.tracklist) {
      return Promise.resolve();
    }

    console.log('Mopidy is not online. Triggering connect() and polling...');
    if (this.mopidy && !this.isOnline) {
      try {
         // Attempt to force a connection if auto-reconnect backoff is waiting too long
         this.mopidy.connect();
      } catch (e) {
         // Ignore if already connecting
      }
    }

    return new Promise((resolve, reject) => {
      let attempts = 0;
      const interval = setInterval(() => {
        if (this.isOnline && this.mopidy?.tracklist) {
          clearInterval(interval);
          resolve();
        } else if (attempts >= 20) { // 10 seconds
          clearInterval(interval);
          const currentUrl = this.mopidy?._webSocketUrl || 'unknown';
          reject(new Error(`Media server at ${currentUrl} is currently offline or unreachable.`));
        }
        attempts++;
      }, 500);
    });
  }

  // --- Controls ---
  public play() { if (this.isOnline && this.mopidy?.playback) this.mopidy.playback.play(); }
  public pause() { if (this.isOnline && this.mopidy?.playback) this.mopidy.playback.pause(); }
  public stop() { if (this.isOnline && this.mopidy?.playback) this.mopidy.playback.stop(); }
  public next() { if (this.isOnline && this.mopidy?.playback) this.mopidy.playback.next(); }
  public previous() { if (this.isOnline && this.mopidy?.playback) this.mopidy.playback.previous(); }
  
  public async playHofbarStream(): Promise<void> {
    await this.ensureConnected();

    await this.mopidy.tracklist.clear();
    await this.mopidy.tracklist.add({ uris: ['https://hofbar.beatnik.ch/stream'] });
    await this.mopidy.playback.play();
  }
}
