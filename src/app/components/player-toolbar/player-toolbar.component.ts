// player-toolbar.component.ts
import { Component, OnInit, OnDestroy, OnChanges, SimpleChanges } from '@angular/core'; // OnChanges und SimpleChanges hinzugefügt
import { Observable, Subscription, tap, firstValueFrom } from 'rxjs'; // firstValueFrom hinzugefügt
import { Group, Stream, ServerDetail, Client, SnapCastServerStatusResponse } from 'src/app/model/snapcast.model'; // Client importiert für Typisierung
import { SnapcastService } from 'src/app/services/snapcast.service';

@Component({
  selector: 'app-player-toolbar',
  templateUrl: './player-toolbar.component.html',
  styleUrls: ['./player-toolbar.component.scss'],
  standalone: false, 
})
export class PlayerToolbarComponent implements OnInit, OnChanges, OnDestroy {

  // public groups$: Observable<Group[]>;
  // public streams$: Observable<Stream[]>;
  // public serverDetails$: Observable<ServerDetail | undefined>;
  public displayState$: Observable<SnapCastServerStatusResponse | null>;

  private subscriptions = new Subscription();

  constructor(
    public snapcastService: SnapcastService, // public gemacht, damit im Template direkt darauf zugegriffen werden kann, falls nötig
    // private modalController: ModalController // Behalten, wenn es verwendet wird, sonst entfernen
  ) {

    this.displayState$ = this.snapcastService.displayState$.pipe(
      tap(state => console.log('%cPlayerToolbarComponent: displayState$ empfangen', 'color: orange; font-weight: bold;', new Date().toLocaleTimeString(), state))
    );
    // Zuweisung der Observables vom Service
    // Der tap-Operator ist nützlich für Debugging-Zwecke.
    // this.groups$ = this.snapcastService.groups$.pipe(
    //   tap(groups => console.log('%cPlayerToolbarComponent: groups$ empfangen', 'color: orange; font-weight: bold;', new Date().toLocaleTimeString(), groups))
    // );
    // this.streams$ = this.snapcastService.streams$.pipe(
    //   tap(streams => console.log('%cPlayerToolbarComponent: streams$ empfangen', 'color: teal; font-weight: bold;', new Date().toLocaleTimeString(), streams))
    // );
    // this.serverDetails$ = this.snapcastService.serverDetails$.pipe(
    //   tap(details => console.log('%cPlayerToolbarComponent: serverDetails$ empfangen', 'color: magenta; font-weight: bold;', new Date().toLocaleTimeString(), details))
    // );
  }

  ngOnInit(): void {
    this.snapcastService.connect();

    // Diese Subskription ist hauptsächlich für Debugging-Zwecke.
    // Für die Anzeige im Template wird die async-Pipe bevorzugt.
    // this.subscriptions.add(
    //   this.groups$.subscribe(groups => {
    //     console.log("PlayerToolbarComponent: Manuelle Subskription auf groups$:", groups);
    //   })
    // );
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Dieser Hook wird nur aufgerufen, wenn die Komponente @Input()-Properties hat
    // und sich deren Werte ändern.
    console.log('PlayerToolbarComponent: ngOnChanges aufgerufen', changes);
  }

  pauseStream(streamId: string): void {
    // Die Subskription wird zum subscriptions-Objekt hinzugefügt,
    // um sie in ngOnDestroy automatisch zu beenden.
    this.subscriptions.add(
      this.snapcastService.streamControl(streamId, 'pause').subscribe({
        next: () => {
          console.log(`Stream ${streamId} Pause-Befehl gesendet.`);
        },
        error: err => console.error(`Fehler beim Pausieren von Stream ${streamId}`, err)
      })
    );
  }

  setGroupVolume(event: any, group: Group): void {
    const clients = group.clients || [];
    let value: number;

    // Sicherstellen, dass der Wert korrekt aus dem Event extrahiert wird
    if (event && typeof event.detail?.value === 'number') {
        value = event.detail.value;
    } else if (event && event.target && typeof event.target.value !== 'undefined') {
        value = parseFloat(event.target.value);
    } else {
        console.error('PlayerToolbarComponent: Konnte Lautstärkewert nicht aus Event extrahieren:', event);
        return;
    }

    if (isNaN(value)) {
        console.error('PlayerToolbarComponent: Lautstärkewert ist NaN:', event);
        return;
    }

    console.log(`PlayerToolbarComponent: Setze Lautstärke für Gruppe ${group.id} auf ${value}`);
    for (const client of clients) {
      this.subscriptions.add(
        this.snapcastService.setClientVolumePercent(client.id, value).subscribe({
          next: () => console.log(`PlayerToolbarComponent: Lautstärke für Client ${client.id} auf ${value} gesetzt (RPC gesendet).`),
          error: err => console.error(`PlayerToolbarComponent: Fehler beim Setzen der Lautstärke für Client ${client.id}`, err)
        })
      );
    }
  }

  // Diese Methode wurde angepasst, um Speicherlecks zu vermeiden und den aktuellen Wert einmalig zu loggen.
  async streamVolumeChanged(): Promise<void> {
    console.log('PlayerToolbarComponent: streamVolumeChanged Event ausgelöst.');
    try {
      // Ruft den aktuellen Wert von groups$ ab und loggt ihn.
      const currentGroups = await firstValueFrom(this.snapcastService.groups$);
      console.log('PlayerToolbarComponent: Aktuelle Gruppen bei streamVolumeChanged:', currentGroups);
    } catch (error) {
      console.error('PlayerToolbarComponent: Fehler beim Abrufen der Gruppen bei streamVolumeChanged:', error);
    }
  }

  ngOnDestroy(): void {
    // Alle manuellen Subskriptionen beenden, um Speicherlecks zu vermeiden.
    this.subscriptions.unsubscribe();
  }
}