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

  constructor() {
    this.initMopidy();
  }

  private async initMopidy() {
    let url = '';
    await Preferences.get({ key: UserPreference.SERVER_URL }).then((result) => {
      url = result.value || 'beatnik-server.local';
    });
    
    // remove http:// or https:// from url if present
    const cleanUrl = url.replace(/(^\w+:|^)\/\//, '');

    this.mopidy = new Mopidy({
      webSocketUrl: `ws://${cleanUrl}:6680/mopidy/ws/`
    });

    this.mopidy.on('state:online', () => this.fetchCurrentTrack());
    
    this.mopidy.on('event:trackPlaybackStarted', (event: any) => {
      this.currentTrackSubject.next(event.tl_track.track.name);
    });
  }

  private fetchCurrentTrack() {
    this.mopidy.playback.getCurrentTrack().then((track: any) => {
      this.currentTrackSubject.next(track ? track.name : 'Idle');
    });
  }

  // --- Controls ---
  public play() { this.mopidy.playback.play(); }
  public pause() { this.mopidy.playback.pause(); }
  public stop() { this.mopidy.playback.stop(); }
  public next() { this.mopidy.playback.next(); }
  public previous() { this.mopidy.playback.previous(); }
  
  public playHofbarStream() {
    this.mopidy.tracklist.clear().then(() => {
      this.mopidy.tracklist.add({ uris: ['https://hofbar.beatnik.ch/stream'] }).then(() => {
        this.mopidy.playback.play();
      });
    });
  }
}
