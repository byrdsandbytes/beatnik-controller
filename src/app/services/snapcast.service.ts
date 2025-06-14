import { Injectable, OnDestroy } from '@angular/core';
import { webSocket, WebSocketSubject, WebSocketSubjectConfig } from 'rxjs/webSocket';
import {
  Subject,
  Subscription,
  Observable,
  filter,
  map,
  shareReplay,
  catchError,
  take,
  throwError,
  distinctUntilChanged,
  switchMap,
  timer,
  EMPTY,
  BehaviorSubject,
  combineLatest,
  firstValueFrom,
} from 'rxjs';
import { produce } from 'immer'; // Für sichere, unveränderliche Updates

// Ihre Model-Importe (stellen Sie sicher, dass die Pfade korrekt sind)
import {
  SnapCastServerStatusResponse,
  Group,
  Client,
  Stream,
  ServerDetail,
  Volume,
  StreamControlCommandType,
  StreamControlCommandSpecificParams,
  StreamControlRpcPayloadParams,
  StreamLoopStatus,
  StreamSetPropertyRpcPayloadParams,
} from '../model/snapcast.model';
import {
  SnapcastWebsocketNotification,
  ClientVolumeChange, ClientOnConnect, ClientOnDisconnect,
  StreamOnProperties, StreamOnUpdate,
  GroupMuteChange, GroupStreamChange, GroupNameChange,
  ServerOnUpdate as ServerOnUpdateNotificationParams // Alias, um Konflikte zu vermeiden
} from '../model/snapcast-websocket-notification.model';

// JSON-RPC und WebSocket Nachrichtentypen
interface JsonRpcBaseRequest { jsonrpc: '2.0'; id: number; method: string; }
interface JsonRpcRequest<P = unknown> extends JsonRpcBaseRequest { params?: P; }
interface JsonRpcResponse<R = unknown> { jsonrpc: '2.0'; id: number; result?: R; error?: { code: number; message: string }; }
type SnapcastWebSocketMessage = JsonRpcResponse<unknown> | SnapcastWebsocketNotification | { error: string; data?: unknown; message?: string } | { [key: string]: any };

// Hilfsfunktion für Deep Merge (einfache Version)
// Erwägen Sie lodash.mergeWith für komplexere Szenarien
function simpleDeepMerge(target: any, source: any): any {
  const output = { ...target };
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          Object.assign(output, { [key]: source[key] });
        } else {
          output[key] = simpleDeepMerge(target[key], source[key]);
        }
      } else {
        Object.assign(output, { [key]: source[key] });
      }
    });
  }
  return output;
}
function isObject(item: any): boolean {
  return (item && typeof item === 'object' && !Array.isArray(item));
}


@Injectable({ providedIn: 'root' })
export class SnapcastService implements OnDestroy {
  private readonly DEFAULT_HOSTNAME = 'byrds-audiopi.local';
  private readonly DEFAULT_PORT = 1780;
  private readonly RECONNECT_INTERVAL_MS = 5000;

  private ws$?: WebSocketSubject<SnapcastWebSocketMessage>;
  private rpcRequestId = 1;
  private rpcResponses$ = new Subject<JsonRpcResponse<unknown>>();
  private serviceSubscriptions = new Subscription();

  private reportedStateSubject$ = new BehaviorSubject<SnapCastServerStatusResponse | null>(null);
  private desiredStateSubject$ = new BehaviorSubject<Partial<SnapCastServerStatusResponse>>({});

  public readonly displayState$: Observable<SnapCastServerStatusResponse | null>;
  public readonly groups$: Observable<Group[]>;
  public readonly streams$: Observable<Stream[]>;
  public readonly serverDetails$: Observable<ServerDetail | undefined>;
  public readonly isConnected$: Observable<boolean>;

  constructor() {
    this.isConnected$ = new BehaviorSubject<boolean>(false).asObservable(); // Wird später von connect/closeObserver aktualisiert

    this.displayState$ = combineLatest([
      this.reportedStateSubject$,
      this.desiredStateSubject$
    ]).pipe(
      map(([reported, desired]) => {
        if (!reported) return null;
        // Erstelle eine tiefe Kopie des reportedState als Basis für den displayState
        let display = JSON.parse(JSON.stringify(reported));
        // Wende desiredState auf die Kopie an
        if (Object.keys(desired).length > 0) {
          display = simpleDeepMerge(display, desired);
        }
        return display;
      }),
      shareReplay({ bufferSize: 1, refCount: true })
    );

    this.groups$ = this.displayState$.pipe(map(state => state?.server?.groups || []), distinctUntilChanged((p, c) => JSON.stringify(p) === JSON.stringify(c)));
    this.streams$ = this.displayState$.pipe(map(state => state?.server?.streams || []), distinctUntilChanged((p, c) => JSON.stringify(p) === JSON.stringify(c)));
    this.serverDetails$ = this.displayState$.pipe(map(state => state?.server?.server), distinctUntilChanged((p, c) => JSON.stringify(p) === JSON.stringify(c)));
  }

  private updateConnectionStatus(isConnected: boolean): void {
    // Sicherstellen, dass isConnected$ ein BehaviorSubject ist, um den Status zu aktualisieren
    if ((this.isConnected$ as BehaviorSubject<boolean>).next) {
      (this.isConnected$ as BehaviorSubject<boolean>).next(isConnected);
    }
  }

  connect(host: string = this.DEFAULT_HOSTNAME, port: number = this.DEFAULT_PORT): void {
    if (this.ws$ && !this.ws$.closed) return;
    this.disconnectInternals(false);
    const wsUrl = `ws://${host}:${port}/jsonrpc`;
    console.info(`SnapcastService: Connecting to ${wsUrl}...`);
    this.updateConnectionStatus(false);

    const config: WebSocketSubjectConfig<SnapcastWebSocketMessage> = {
      url: wsUrl,
      openObserver: {
        next: () => {
          console.info('SnapcastService: WebSocket connection established.');
          this.updateConnectionStatus(true);
          this.fetchInitialServerStatus();
        },
      },
      closeObserver: {
        next: () => {
          console.warn('SnapcastService: WebSocket connection closed. Attempting to reconnect...');
          this.updateConnectionStatus(false);
          this.ws$ = undefined;
          const reconnectSub = timer(this.RECONNECT_INTERVAL_MS).subscribe(() => this.connect(host, port));
          this.serviceSubscriptions.add(reconnectSub);
        },
      },
      deserializer: (e: MessageEvent): SnapcastWebSocketMessage => {
        try { return JSON.parse(e.data); }
        catch (err) { console.error('SnapcastService: Deserialization error', err, e.data); return { error: 'DeserializationError', data: e.data, message: (err as Error).message }; }
      },
    };

    this.ws$ = webSocket<SnapcastWebSocketMessage>(config);
    const messageHandlingSub = this.ws$.pipe(
      catchError(error => { console.error('SnapcastService: WebSocket stream error.', error); this.updateConnectionStatus(false); return EMPTY; })
    ).subscribe({
      next: msg => this.routeMessage(msg),
      error: err => { console.error('SnapcastService: WebSocket fatal subscription error:', err); this.updateConnectionStatus(false); },
    });
    this.serviceSubscriptions.add(messageHandlingSub);
  }

  private fetchInitialServerStatus(): void {
    this.rpc<never, SnapCastServerStatusResponse>('Server.GetStatus').pipe(take(1)).subscribe({
      next: response => {
        if (response.result) {
          this.reportedStateSubject$.next(response.result); // Ist bereits ein neues Objekt
          this.desiredStateSubject$.next({}); // Wünsche zurücksetzen
        } else if (response.error) {
          console.error('SnapcastService: Error in initial status RPC result', response.error);
        }
      },
      error: err => console.error('SnapcastService: Failed RPC for initial status:', err),
    });
  }

  private routeMessage(message: SnapcastWebSocketMessage): void {
    if (!message || typeof message !== 'object') { console.warn('SnapcastService: Received invalid message', message); return; }

    if ('id' in message && typeof (message as JsonRpcResponse<unknown>).id === 'number' && !('method' in message)) {
      this.rpcResponses$.next(message as JsonRpcResponse<unknown>);
    } else if ('method' in message && typeof (message as SnapcastWebsocketNotification).method === 'string') {
      const notification = message as SnapcastWebsocketNotification;
      if (notification.method === 'Server.OnUpdate') {
        const serverUpdate = notification.params as ServerOnUpdateNotificationParams;
        if (serverUpdate.server) {
          this.reportedStateSubject$.next({ server: serverUpdate.server }); // Ist bereits ein neues Objekt
          this.desiredStateSubject$.next({});
        }
      } else {
        this.applyNotificationToReportedState(notification);
      }
    } else if ((message as any).error === 'DeserializationError') { /* Bereits geloggt */ }
    else { console.warn('SnapcastService: Unknown message structure:', message); }
  }

  private applyNotificationToReportedState(notification: SnapcastWebsocketNotification): void {
    const currentState = this.reportedStateSubject$.getValue();
    if (!currentState) { console.warn('SnapcastService: No reported state to apply notification to.', notification); return; }

    const nextState = produce(currentState, draft => {
      const server = draft.server; // draft.server ist der Server-Teil des SnapCastServerStatusResponse
      if (!server) { console.warn('SnapcastService: draft.server is undefined in applyNotification'); return; }

      switch (notification.method) {
        case 'Client.OnVolumeChanged':
          const volParams = notification.params as ClientVolumeChange;
          server.groups.forEach(group =>
            group.clients.forEach(c => { if (c.id === volParams.id) c.config.volume = volParams.volume; })
          );
          // Ggf. korrespondierenden Wert aus desiredState entfernen
          this.clearDesiredClientVolume(volParams.id);
          break;
        case 'Client.OnConnect':
        case 'Client.OnDisconnect':
          const connParams = notification.params as ClientOnConnect | ClientOnDisconnect;
          const isConnect = notification.method === 'Client.OnConnect';
          let clientFound = false;
          server.groups.forEach(group => {
            const clientIndex = group.clients.findIndex(c => c.id === connParams.id);
            if (clientIndex > -1) {
              if (isConnect) {
                Object.assign(group.clients[clientIndex], (connParams as ClientOnConnect).client);
                group.clients[clientIndex].connected = true;
              } else {
                group.clients[clientIndex].connected = false; // Oder Client entfernen: group.clients.splice(clientIndex, 1);
              }
              clientFound = true;
            }
          });
          if (isConnect && !clientFound && (connParams as ClientOnConnect).client) {
            // TODO: Client einer Gruppe zuordnen, falls er neu ist. Benötigt Gruppeninfo oder Standardgruppe.
            console.warn(`SnapcastService: New client ${connParams.id} connected but not assigned to a group yet.`);
          }
          break;
        case 'Stream.OnProperties':
          const spParams = notification.params as StreamOnProperties;
          const streamProps = server.streams.find(s => s.id === spParams.id);
          if (streamProps) streamProps.properties = spParams.properties;
          break;
        case 'Stream.OnUpdate':
          const suParams = notification.params as StreamOnUpdate;
          const streamIdx = server.streams.findIndex(s => s.id === suParams.id);
          if (streamIdx > -1) server.streams[streamIdx] = { ...server.streams[streamIdx], ...suParams.stream };
          else server.streams.push(suParams.stream);
          break;
        case 'Group.OnMute':
          const gmParams = notification.params as GroupMuteChange;
          const groupMute = server.groups.find(g => g.id === gmParams.id);
          if (groupMute) groupMute.muted = gmParams.mute;
          this.clearDesiredGroupMute(gmParams.id);
          break;
        case 'Group.OnStreamChanged':
          const gsParams = notification.params as GroupStreamChange;
          const groupStream = server.groups.find(g => g.id === gsParams.id);
          if (groupStream) groupStream.stream_id = gsParams.stream_id;
          this.clearDesiredGroupStream(gsParams.id);
          break;
        case 'Group.OnNameChanged':
          const gnParams = notification.params as GroupNameChange;
          const groupName = server.groups.find(g => g.id === gnParams.id);
          if (groupName) groupName.name = gnParams.name;
          this.clearDesiredGroupName(gnParams.id);
          break;
        default:
          console.warn(`SnapcastService: Unhandled notification in applyToReportedState: ${notification.method}`);
      }
    });
    this.reportedStateSubject$.next(nextState);
  }

  private rpc<P, R>(method: string, params?: P): Observable<JsonRpcResponse<R>> {
    if (!this.ws$ || this.ws$.closed) return throwError(() => new Error('SnapcastService: WebSocket not connected.'));
    const id = this.rpcRequestId++;
    const request: JsonRpcRequest<P> = { jsonrpc: '2.0', id, method, ...(params && { params }) };
    this.ws$.next(request as SnapcastWebSocketMessage);
    return this.rpcResponses$.pipe(
      filter(response => response.id === id),
      take(1),
      map(response => response as JsonRpcResponse<R>),
      catchError(err => { console.error(`SnapcastService: RPC error for ${method} (id ${id})`, err); return throwError(() => new Error(`RPC for ${method} failed`)); })
    );
  }

  // --- Hilfsmethoden zum Aktualisieren/Löschen von desiredState ---
  private updateDesiredState(update: Partial<SnapCastServerStatusResponse>): void {
    const currentDesired = this.desiredStateSubject$.getValue();
    // simpleDeepMerge ist wichtig, um verschachtelte Wünsche nicht zu überschreiben
    const nextDesired = simpleDeepMerge(JSON.parse(JSON.stringify(currentDesired)), update);
    this.desiredStateSubject$.next(nextDesired);
  }

  private clearDesiredClientVolume(clientId: string): void {
    this.desiredStateSubject$.next(
      produce(this.desiredStateSubject$.getValue(), draft => {
        if (draft.server?.groups) {
          draft.server.groups.forEach(g => {
            const client = g.clients.find(c => c.id === clientId);
            // if (client?.config?.volume.percent) delete client.config.volume.percent; // Oder die ganze Volume-Struktur löschen
            // Wenn Volume leer ist, Client-Config löschen etc. - für Sauberkeit
          });
        }
      })
    );
  }
  // Ähnliche clearDesired... Methoden für andere Eigenschaften (Mute, GroupName etc.)

  private clearDesiredGroupMute(groupId: string): void { /* ... */ }
  private clearDesiredGroupStream(groupId: string): void { /* ... */ }
  private clearDesiredGroupName(groupId: string): void { /* ... */ }
  private clearDesiredStreamProperty(streamId: string, propertyName: keyof StreamSetPropertyRpcPayloadParams): void { /* ... */ }


  // --- Vereinfachte Action-Methoden (aktualisieren desiredState und senden RPC) ---

  public setClientVolumePercent(clientId: string, percent: number): Observable<void> {
    if (percent < 0 || percent > 100) return throwError(() => new Error('Volume % out of range.'));

    // Optimistic Update für desiredState
    // Erfordert eine Struktur, um Client-Volumen im desiredState zu setzen
    // Dies kann komplex werden, wenn man die Gruppenstruktur nachbilden muss.
    // Ein einfacherer Ansatz für desiredState könnte eine flachere Struktur sein,
    // z.B. desiredState.clientVolumes[clientId] = percent.
    // Für dieses Beispiel aktualisiere ich es, als ob die Struktur im desiredState existiert.
    this.updateDesiredState({
      server: {
        groups: this.reportedStateSubject$.getValue()?.server.groups.map(g => ({
          ...g,
          clients: g.clients.map(c => c.id === clientId ? { ...c, config: { ...c.config, volume: { ...c.config.volume, percent } } } : c)
        }))
      } as any
    });

    return EMPTY;
  }

  public setClientMute(clientId: string, mute: boolean): Observable<void> {
    this.updateDesiredState({
      server: {
        groups: this.reportedStateSubject$.getValue()?.server.groups.map(g => ({
          ...g,
          clients: g.clients.map(c => c.id === clientId ? { ...c, config: { ...c.config, volume: { ...c.config.volume, muted: mute } } } : c)
        }))
      } as any
    });

    return this.getClient(clientId).pipe(
      take(1),
      switchMap(clientState => {
        if (!clientState) return throwError(() => new Error(`Client ${clientId} not found.`));
        const volumePayload: Volume = { percent: clientState.config.volume.percent, muted: mute };
        return this.rpc('Client.SetVolume', { id: clientId, volume: volumePayload });
      }),
      map(() => void 0),
      catchError(err => { console.error(`SnapcastService: Failed to set mute for client ${clientId}`, err); /* TODO: Rollback desiredState */ return throwError(() => err); })
    );
  }

  public setGroupName(groupId: string, name: string): Observable<void> {
    this.updateDesiredState({ server: { groups: [{ id: groupId, name }] } as any });
    return this.rpc('Group.SetName', { id: groupId, name }).pipe(map(() => void 0), catchError(err => { console.error(`SnapcastService: Failed to set name for group ${groupId}`, err); /* TODO: Rollback desiredState */ return throwError(() => err); }));
  }

  public setGroupMute(groupId: string, mute: boolean): Observable<void> {
    this.updateDesiredState({ server: { groups: [{ id: groupId, muted: mute }] } as any });
    return this.rpc('Group.SetMute', { id: groupId, mute }).pipe(map(() => void 0), catchError(err => { console.error(`SnapcastService: Failed to set mute for group ${groupId}`, err); /* TODO: Rollback desiredState */ return throwError(() => err); }));
  }

  public setGroupStream(groupId: string, streamId: string): Observable<void> {
    this.updateDesiredState({ server: { groups: [{ id: groupId, stream_id: streamId }] } as any });
    return this.rpc('Group.SetStream', { id: groupId, stream_id: streamId }).pipe(map(() => void 0), catchError(err => { console.error(`SnapcastService: Failed to set stream for group ${groupId}`, err); /* TODO: Rollback desiredState */ return throwError(() => err); }));
  }


  public streamControl(streamId: string, command: StreamControlCommandType, commandParams?: StreamControlCommandSpecificParams): Observable<void> {
    // Für Steuerbefehle ist ein optimistisches Update des 'playbackStatus' im desiredState sinnvoll
    if (command === 'play' || command === 'playPause' /* (je nach aktuellem Status) */) {
      this.updateDesiredState({ server: { streams: [{ id: streamId, status: 'playing' }] } as any });
    } else if (command === 'pause' || command === 'stop') {
      this.updateDesiredState({ server: { streams: [{ id: streamId, status: 'paused' /* oder 'stopped' */ }] } as any });
    }
    // 'next', 'previous', 'seek', 'setPosition' ändern auch den Zustand, hier wird es komplexer für desiredState
    const rpcParams: StreamControlRpcPayloadParams = { id: streamId, command };
    if (commandParams && (command === 'seek' || command === 'setPosition')) rpcParams.params = commandParams;
    return this.rpc<StreamControlRpcPayloadParams, string>('Stream.Control', rpcParams).pipe(map(() => void 0), catchError(err => { console.error(`SnapcastService: Stream.Control failed for ${streamId}, command ${command}`, err); /* TODO: Rollback desiredState */ return throwError(() => err); }));
  }

  private streamSetPropertyInternal(streamId: string, property: string, value: any): Observable<void> {
    this.updateDesiredState({ server: { streams: [{ id: streamId, properties: { [property]: value } }] } as any });
    const rpcParams: StreamSetPropertyRpcPayloadParams = { id: streamId, property, value };
    return this.rpc<StreamSetPropertyRpcPayloadParams, string>('Stream.SetProperty', rpcParams).pipe(map(() => void 0), catchError(err => { console.error(`SnapcastService: Stream.SetProperty failed for ${streamId}, property ${property}`, err); /* TODO: Rollback desiredState */ return throwError(() => err); }));
  }
  public streamSetLoopStatus(streamId: string, loopStatus: StreamLoopStatus): Observable<void> { return this.streamSetPropertyInternal(streamId, 'loopStatus', loopStatus); }
  public streamSetShuffle(streamId: string, shuffle: boolean): Observable<void> { return this.streamSetPropertyInternal(streamId, 'shuffle', shuffle); }
  public streamSetPlayerVolume(streamId: string, volumePercent: number): Observable<void> { if (volumePercent < 0 || volumePercent > 100) return throwError(() => new Error('Stream player volume out of range.')); return this.streamSetPropertyInternal(streamId, 'volume', volumePercent); }
  public streamSetPlayerMute(streamId: string, mute: boolean): Observable<void> { return this.streamSetPropertyInternal(streamId, 'mute', mute); }
  public streamSetPlaybackRate(streamId: string, rate: number): Observable<void> { if (rate <= 0) return throwError(() => new Error('Stream playback rate must be > 0.')); return this.streamSetPropertyInternal(streamId, 'rate', rate); }


  // --- Vereinfachte Datenzugriffsmethoden (basieren auf displayState$) ---
  public getClient(clientId: string): Observable<Client | undefined> {
    return this.displayState$.pipe(
      map(state => state?.server?.groups.flatMap(g => g.clients).find(c => c.id === clientId)),
      distinctUntilChanged((p, c) => JSON.stringify(p) === JSON.stringify(c))
    );
  }
  public getGroup(groupId: string): Observable<Group | undefined> {
    return this.displayState$.pipe(
      map(state => state?.server?.groups.find(g => g.id === groupId)),
      distinctUntilChanged((p, c) => JSON.stringify(p) === JSON.stringify(c))
    );
  }
  public getStream(streamId: string): Observable<Stream | undefined> {
    return this.displayState$.pipe(
      map(state => state?.server?.streams.find(s => s.id === streamId)),
      distinctUntilChanged((p, c) => JSON.stringify(p) === JSON.stringify(c))
    );
  }

  // --- Standard Disconnect und ngOnDestroy ---
  public disconnect(): void {
    this.disconnectInternals(true);
    this.updateConnectionStatus(false);
  }
  private disconnectInternals(fullCleanup: boolean): void {
    if (this.ws$) { this.ws$.complete(); this.ws$ = undefined; }
    if (fullCleanup) { this.serviceSubscriptions.unsubscribe(); this.serviceSubscriptions = new Subscription(); }
  }
  ngOnDestroy(): void {
    this.disconnect();
    this.reportedStateSubject$.complete();
    this.desiredStateSubject$.complete();
    this.rpcResponses$.complete();
  }
}