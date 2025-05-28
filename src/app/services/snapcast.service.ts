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
  firstValueFrom,
  timer,
  EMPTY,
  tap
} from 'rxjs';
import {
  SnapCastServerStatusResponse,
  Group,
  Client,
  Stream,
  ServerDetail,
  Volume,
  StreamControlCommandSpecificParams,
  StreamControlCommandType,
  StreamControlRpcPayloadParams,
  StreamLoopStatus,
  StreamSetPropertyRpcPayloadParams,
} from '../model/snapcast.model'; // Adjust path
import { SnapcastWebsocketNotificationService } from './snapcast-websocket-notification.service'; // Adjust path
import { SnapcastWebsocketNotification } from '../model/snapcast-websocket-notification.model'; // Adjust path

// --- Existing JSON-RPC and WebSocket Message Types ---
interface JsonRpcBaseRequest { jsonrpc: '2.0'; id: number; method: string; }
interface JsonRpcRequest<P = unknown> extends JsonRpcBaseRequest { params?: P; }
interface JsonRpcResponse<R = unknown> { jsonrpc: '2.0'; id: number; result?: R; error?: { code: number; message: string }; }
type SnapcastWebSocketMessage = JsonRpcResponse<unknown> | SnapcastWebsocketNotification | { error: string; data?: unknown; message?: string } | { [key: string]: any };

@Injectable({ providedIn: 'root' })
export class SnapcastService implements OnDestroy {
  // --- Existing Properties (hostname, port, ws$, rpcRequestId, etc.) ---
  private readonly DEFAULT_HOSTNAME = 'byrds-audiopi.local';
  private readonly DEFAULT_PORT = 1780;
  private readonly RECONNECT_INTERVAL_MS = 5000;

  private ws$?: WebSocketSubject<SnapcastWebSocketMessage>;
  private rpcRequestId = 1;
  private rpcResponses$ = new Subject<JsonRpcResponse<unknown>>();
  private serviceSubscriptions = new Subscription();

  private statusSubject$ = new Subject<SnapCastServerStatusResponse>();
  public readonly status$: Observable<SnapCastServerStatusResponse>;

  public readonly groups$: Observable<Group[]>;
  public readonly streams$: Observable<Stream[]>;
  public readonly serverDetails$: Observable<ServerDetail | undefined>;

  constructor(
    private readonly notificationService: SnapcastWebsocketNotificationService,
  ) {
    this.status$ = this.statusSubject$.asObservable().pipe(
      shareReplay({ bufferSize: 1, refCount: true })
    );

    this.groups$ = this.status$.pipe(
      map(status => status?.server?.groups || []),
      distinctUntilChanged()
    );

    this.streams$ = this.status$.pipe(
      map(status => status?.server?.streams || []),
      distinctUntilChanged()
    );

    this.serverDetails$ = this.status$.pipe(
      map(status => status?.server?.server),
      distinctUntilChanged()
    );
  }

  // --- Core Methods (connect, fetchInitialServerStatus, routeMessage, processMessageWithNotificationService, rpc, disconnect, etc.) ---
  // These should be the full implementations from your previous "usable" version.
  // Crucially, processMessageWithNotificationService must deep clone status updates.
  // For brevity, only stubs are shown here; ensure you have the complete working code.

  connect(host: string = this.DEFAULT_HOSTNAME, port: number = this.DEFAULT_PORT): void {
    if (this.ws$ && !this.ws$.closed) return;
    this.disconnectInternals(false);
    const wsUrl = `ws://${host}:${port}/jsonrpc`;
    console.info(`SnapcastService: Connecting to ${wsUrl}...`);
    const config: WebSocketSubjectConfig<SnapcastWebSocketMessage> = {
      url: wsUrl,
      openObserver: { next: () => { console.info('SnapcastService: WebSocket connected.'); this.fetchInitialServerStatus(); } },
      closeObserver: { next: () => { console.warn('SnapcastService: WebSocket closed. Reconnecting...'); this.ws$ = undefined; const sub = timer(this.RECONNECT_INTERVAL_MS).subscribe(() => this.connect(host, port)); this.serviceSubscriptions.add(sub); } },
      deserializer: (e: MessageEvent): SnapcastWebSocketMessage => { try { return JSON.parse(e.data); } catch (err) { console.error('SnapcastService: Deserialization error', err); return { error: 'DeserializationError', data: e.data }; } }
    };
    this.ws$ = webSocket<SnapcastWebSocketMessage>(config);
    const sub = this.ws$.pipe(catchError(() => EMPTY)).subscribe({ next: msg => this.routeMessage(msg), error: err => console.error('SnapcastService: WebSocket fatal error', err) });
    this.serviceSubscriptions.add(sub);
  }

  private fetchInitialServerStatus(): void {
    const sub = this.rpc<never, SnapCastServerStatusResponse>('Server.GetStatus').pipe(take(1)).subscribe({
      next: res => { if (res.result) this.statusSubject$.next(JSON.parse(JSON.stringify(res.result))); else console.error('SnapcastService: Error in initial status RPC result', res.error); },
      error: err => console.error('SnapcastService: Failed initial status RPC', err)
    });
    this.serviceSubscriptions.add(sub);
  }

  private routeMessage(message: SnapcastWebSocketMessage): void {
    if (!message || typeof message !== 'object') return;
    if ('id' in message && typeof (message as JsonRpcResponse<unknown>).id === 'number' && !('method' in message)) {
      this.rpcResponses$.next(message as JsonRpcResponse<unknown>);
    } else if ('method' in message && typeof (message as SnapcastWebsocketNotification).method === 'string') {
      const notification = message as SnapcastWebsocketNotification;
      if (notification.method === 'Server.OnUpdate' && notification.params) {
        const serverUpdateParams = notification.params as { server: SnapCastServerStatusResponse['server'] };
        this.statusSubject$.next(JSON.parse(JSON.stringify({ server: serverUpdateParams.server })));
      } else {
        this.processMessageWithNotificationService(notification);
      }
    } else if ((message as any).error === 'DeserializationError') { /* Logged in deserializer */ }
    else { console.warn('SnapcastService: Unknown message structure', message); }
  }

  private async processMessageWithNotificationService(message: SnapcastWebsocketNotification): Promise<void> {
    try {
      const currentStatus = await firstValueFrom(this.status$, { defaultValue: undefined as any });
      if (!currentStatus) { console.warn('SnapcastService: No current status for notification processing.', message); return; }
      const statusToMutate = JSON.parse(JSON.stringify(currentStatus)); // Clone before passing to mutating service
      const statusAfterMutation = await this.notificationService.handleNotification(message, statusToMutate);
      if (statusAfterMutation) {
        this.statusSubject$.next(JSON.parse(JSON.stringify(statusAfterMutation))); // Clone again if handleNotification might return original ref
      }
    } catch (error) { console.error('SnapcastService: Error processing notification', error, message); }
  }

  private rpc<P, R>(method: string, params?: P): Observable<JsonRpcResponse<R>> {
    if (!this.ws$ || this.ws$.closed) return throwError(() => new Error('SnapcastService: WebSocket not connected for RPC.'));
    const id = this.rpcRequestId++;
    const request: JsonRpcRequest<P> = { jsonrpc: '2.0', id, method, ...(params && { params }) };
    this.ws$.next(request as SnapcastWebSocketMessage);
    return this.rpcResponses$.pipe(
      filter(response => response.id === id),
      take(1),
      map(response => response as JsonRpcResponse<R>),
      catchError(err => { console.error(`SnapcastService: Error in RPC response for ${method} (id ${id}):`, err); return throwError(() => new Error(`RPC for ${method} failed`)); })
    );
  }

  // --- Existing Simplified Data Access Methods (getClient, getGroup, getStream) ---
  public getClient(clientId: string): Observable<Client | undefined> { /* ...as before... */ return this.groups$.pipe(map(groups => { for (const group of groups) { const client = group.clients.find(c => c.id === clientId); if (client) return client; } return undefined; }), distinctUntilChanged()); }
  public getGroup(groupId: string): Observable<Group | undefined> { /* ...as before... */ return this.groups$.pipe(map(groups => groups.find(g => g.id === groupId)), distinctUntilChanged()); }
  public getStream(streamId: string): Observable<Stream | undefined> { /* ...as before... */ return this.streams$.pipe(map(streams => streams.find(s => s.id === streamId)), distinctUntilChanged()); }


  // --- Existing Simplified Action Methods (setClientMute, etc.) ---
  public setClientMute(clientId: string, mute: boolean): Observable<void> { /* ...as before... */ return this.getClient(clientId).pipe(take(1), switchMap(c => { if (!c) return throwError(() => new Error(`Client ${clientId} not found.`)); const vol: Volume = { percent: c.config.volume.percent, muted: mute }; return this.rpc('Client.SetVolume', { id: clientId, volume: vol }); }), map(() => void 0), catchError(err => { console.error(`SnapcastService: Failed to set mute for client ${clientId}`, err); return throwError(() => err); })); }
  public setClientVolumePercent(clientId: string, percent: number): Observable<void> { /* ...as before... */ if (percent < 0 || percent > 100) return throwError(() => new Error('Volume % out of range.')); return this.getClient(clientId).pipe(take(1), switchMap(c => { if (!c) return throwError(() => new Error(`Client ${clientId} not found.`)); const vol: Volume = { percent: percent, muted: c.config.volume.muted }; return this.rpc('Client.SetVolume', { id: clientId, volume: vol }); }), map(() => void 0), catchError(err => { console.error(`SnapcastService: Failed to set volume % for client ${clientId}`, err); return throwError(() => err); })); }
  public setGroupName(groupId: string, name: string): Observable<void> { /* ...as before... */ return this.rpc('Group.SetName', { id: groupId, name }).pipe(map(() => void 0), catchError(err => { console.error(`SnapcastService: Failed to set name for group ${groupId}`, err); return throwError(() => err); })); }
  public setGroupMute(groupId: string, mute: boolean): Observable<void> { /* ...as before... */ return this.rpc('Group.SetMute', { id: groupId, mute }).pipe(map(() => void 0), catchError(err => { console.error(`SnapcastService: Failed to set mute for group ${groupId}`, err); return throwError(() => err); })); }
  public setGroupStream(groupId: string, streamId: string): Observable<void> { /* ...as before... */ return this.rpc('Group.SetStream', { id: groupId, stream_id: streamId }).pipe(map(() => void 0), catchError(err => { console.error(`SnapcastService: Failed to set stream for group ${groupId}`, err); return throwError(() => err); })); }


  // --- NEW: Stream Control and Property Methods ---

  /**
   * Sends a control command to a specific stream.
   * @param streamId The ID of the stream.
   * @param command The playback command (e.g., 'play', 'pause', 'next').
   * @param commandParams Optional parameters for commands like 'seek' or 'setPosition'.
   */
  public streamControl(
    streamId: string,
    command: StreamControlCommandType,
    commandParams?: StreamControlCommandSpecificParams
  ): Observable<void> {
    const rpcParams: StreamControlRpcPayloadParams = {
      id: streamId,
      command: command,
    };
    if (commandParams && (command === 'seek' || command === 'setPosition')) {
      rpcParams.params = commandParams;
    }
    return this.rpc<StreamControlRpcPayloadParams, string>('Stream.Control', rpcParams).pipe( // Expects "ok" or error
      map(() => void 0), // Assuming "ok" means void for the component
      catchError(err => {
        console.error(`SnapcastService: Stream.Control failed for stream ${streamId}, command ${command}:`, err);
        return throwError(() => err);
      })
    );
  }

  private streamSetPropertyInternal(streamId: string, property: string, value: any): Observable<void> {
    const rpcParams: StreamSetPropertyRpcPayloadParams = {
      id: streamId,
      property: property,
      value: value,
    };
    return this.rpc<StreamSetPropertyRpcPayloadParams, string>('Stream.SetProperty', rpcParams).pipe(
      map(() => void 0),
      catchError(err => {
        console.error(`SnapcastService: Stream.SetProperty failed for stream ${streamId}, property ${property}:`, err);
        return throwError(() => err);
      })
    );
  }

  public streamSetLoopStatus(streamId: string, loopStatus: StreamLoopStatus): Observable<void> {
    return this.streamSetPropertyInternal(streamId, 'loopStatus', loopStatus);
  }

  public streamSetShuffle(streamId: string, shuffle: boolean): Observable<void> {
    return this.streamSetPropertyInternal(streamId, 'shuffle', shuffle);
  }

  /** Sets the volume of the stream's player (0-100). */
  public streamSetPlayerVolume(streamId: string, volumePercent: number): Observable<void> {
    if (volumePercent < 0 || volumePercent > 100) {
      return throwError(() => new Error('Stream player volume must be between 0 and 100.'));
    }
    return this.streamSetPropertyInternal(streamId, 'volume', volumePercent);
  }

  /** Sets the mute state of the stream's player. */
  public streamSetPlayerMute(streamId: string, mute: boolean): Observable<void> {
    return this.streamSetPropertyInternal(streamId, 'mute', mute);
  }

  /** Sets the playback rate of the stream's player. */
  public streamSetPlaybackRate(streamId: string, rate: number): Observable<void> {
    if (rate <= 0) {
      return throwError(() => new Error('Stream playback rate must be greater than 0.'));
    }
    return this.streamSetPropertyInternal(streamId, 'rate', rate);
  }

  // --- Standard disconnect and ngOnDestroy methods ---
  public disconnect(): void { /* ...as before... */ this.disconnectInternals(true); }
  private disconnectInternals(fullCleanup: boolean): void { if (this.ws$) { this.ws$.complete(); this.ws$ = undefined; } if (fullCleanup) { this.serviceSubscriptions.unsubscribe(); this.serviceSubscriptions = new Subscription(); } }
  ngOnDestroy(): void { /* ...as before... */ this.disconnectInternals(true); this.statusSubject$.complete(); this.rpcResponses$.complete(); }
}