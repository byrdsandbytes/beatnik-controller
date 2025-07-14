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
} from 'rxjs';
import { produce } from 'immer';

// --- Model Imports (ensure paths are correct) ---
import {
  SnapCastServerStatusResponse,
  Group,
  Client,
  Stream,
  ServerDetail,
  Volume,
  // Other models you might need for action methods
  StreamControlCommandType,
  StreamControlCommandSpecificParams,
  StreamControlRpcPayloadParams,
  StreamLoopStatus,
  StreamSetPropertyRpcPayloadParams,
} from '../model/snapcast.model';
import {
  SnapcastWebsocketNotification,
  ClientVolumeChange, GroupMuteChange, GroupNameChange, GroupStreamChange,
  ServerOnUpdate as ServerOnUpdateNotificationParams, StreamOnProperties, StreamOnUpdate, ClientOnConnect, ClientOnDisconnect
} from '../model/snapcast-websocket-notification.model';
import { environment } from 'src/environments/environment';
import { Preferences } from '@capacitor/preferences';
import { UserPreference } from '../enum/user-preference.enum';

// --- Type Definitions ---
interface JsonRpcBaseRequest { jsonrpc: '2.0'; id: number; method: string; }
interface JsonRpcRequest<P = unknown> extends JsonRpcBaseRequest { params?: P; }
interface JsonRpcResponse<R = unknown> { jsonrpc: '2.0'; id: number; result?: R; error?: { code: number; message: string }; }
type SnapcastWebSocketMessage = JsonRpcResponse<unknown> | SnapcastWebsocketNotification | { error: string; data?: unknown; message?: string } | { [key: string]: any };

@Injectable({ providedIn: 'root' })
export class SnapcastService implements OnDestroy {
  private readonly DEFAULT_HOSTNAME = environment.snapcastServerUrl;
  private readonly DEFAULT_PORT = 1780;
  private readonly RECONNECT_INTERVAL_MS = 5000;

  private USERPREFERENCE_HOSTNAME?: string;

  private ws$?: WebSocketSubject<SnapcastWebSocketMessage>;
  private rpcRequestId = 1;
  private rpcResponses$ = new Subject<JsonRpcResponse<unknown>>();
  private serviceSubscriptions = new Subscription();

  // A single BehaviorSubject to hold the state. Initialized with null.
  private stateSubject$ = new BehaviorSubject<SnapCastServerStatusResponse | null>(null);

  // --- Public Observables for Component Consumption ---
  // The main state observable. It's the single source of truth.
  public readonly state$: Observable<SnapCastServerStatusResponse | null>;
  // Convenience observables derived from the main state$.
  public readonly groups$: Observable<Group[]>;
  public readonly streams$: Observable<Stream[]>;
  public readonly serverDetails$: Observable<ServerDetail | undefined>;
  public readonly isConnected$ = new BehaviorSubject<boolean>(false).asObservable();

  constructor(
  ) {

    this.state$ = this.stateSubject$.asObservable().pipe(
      shareReplay({ bufferSize: 1, refCount: true })
    );

    // Derived observables use distinctUntilChanged with deep comparison for robustness.
    this.groups$ = this.state$.pipe(map(state => state?.server?.groups || []), distinctUntilChanged((p, c) => JSON.stringify(p) === JSON.stringify(c)));
    this.streams$ = this.state$.pipe(map(state => state?.server?.streams || []), distinctUntilChanged((p, c) => JSON.stringify(p) === JSON.stringify(c)));
    this.serverDetails$ = this.state$.pipe(map(state => state?.server?.server), distinctUntilChanged((p, c) => JSON.stringify(p) === JSON.stringify(c)));
  }

  // --- Core Connection and RPC Logic ---

  async connect(host: string = this.DEFAULT_HOSTNAME, port: number = this.DEFAULT_PORT): Promise<void> {
    // Load user preference for hostname if available
    const url = await Preferences.get({ key: UserPreference.SERVER_URL });
    // overwrite host if user did set a custom URL
    if (url.value) {
      this.USERPREFERENCE_HOSTNAME = url.value;
      host = this.USERPREFERENCE_HOSTNAME;
    }

    if (this.ws$ && !this.ws$.closed) return;
    this.disconnectInternals(false);
    const wsUrl = `ws://${host}:${port}/jsonrpc`;
    console.info(`SnapcastService: Connecting to ${wsUrl}...`);

    const config: WebSocketSubjectConfig<SnapcastWebSocketMessage> = {
      url: wsUrl,
      openObserver: {
        next: () => {
          console.info('SnapcastService: WebSocket connection established.');
          this.fetchInitialServerStatus();
        },
      },
      closeObserver: {
        next: () => {
          console.warn('SnapcastService: WebSocket connection closed. Attempting to reconnect...');
          (this.isConnected$ as BehaviorSubject<boolean>).next(false);
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
      catchError(error => { console.error('SnapcastService: WebSocket stream error.', error); (this.isConnected$ as BehaviorSubject<boolean>).next(false); return EMPTY; })
    ).subscribe({
      next: msg => this.routeMessage(msg),
      error: err => { console.error('SnapcastService: WebSocket fatal subscription error:', err); (this.isConnected$ as BehaviorSubject<boolean>).next(false); },
    });
    this.serviceSubscriptions.add(messageHandlingSub);
  }

  private fetchInitialServerStatus(): void {
    this.rpc<never, SnapCastServerStatusResponse>('Server.GetStatus').pipe(take(1)).subscribe({
      next: response => {
        if (response.result) {
          this.stateSubject$.next(response.result); // Update the state with the full server status
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
      // Server.OnUpdate sends a full state object, replacing the current one.
      if (notification.method === 'Server.OnUpdate') {
        const serverUpdate = notification.params as ServerOnUpdateNotificationParams;
        if (serverUpdate.server) {
          this.stateSubject$.next({ server: serverUpdate.server });
        }
      } else {
        // Other notifications apply a "delta" to the current state.
        this.applyNotificationToState(notification);
      }
    } else if ((message as any).error === 'DeserializationError') { /* Already logged */ }
    else { console.warn('SnapcastService: Unknown message structure:', message); }
  }

  // --- State Update Logic ---

  private applyNotificationToState(notification: SnapcastWebsocketNotification): void {
    const currentState = this.stateSubject$.getValue();
    if (!currentState) { console.warn('SnapcastService: No current state to apply notification to.', notification); return; }

    // Use `immer` to produce a new immutable state by applying changes to a "draft".
    const nextState = produce(currentState, draft => {
      const server = draft.server;
      if (!server) return;

      // This is the logic from the old SnapcastWebsocketNotificationService,
      switch (notification.method) {
        case 'Client.OnVolumeChanged':
          const volParams = notification.params as ClientVolumeChange;
          const clientVol = server.groups.flatMap(g => g.clients).find(c => c.id === volParams.id);
          if (clientVol) clientVol.config.volume = volParams.volume;
          break;
        case 'Client.OnConnect':
          const connectParams = notification.params as ClientOnConnect;
          const newClient = connectParams.client;
          console.log(`SnapcastService: Client connected: ${newClient.id}`);
          break;

        case 'Client.OnDisconnect':
          const disconnectParams = notification.params as ClientOnDisconnect;
          const disconnectedClient = server.groups.flatMap(g => g.clients).find(c => c.id === disconnectParams.id);
          if (disconnectedClient) {
            console.log(`SnapcastService: Client disconnected: ${disconnectedClient.id}`);
            disconnectedClient.connected = false; // Mark as disconnected
          } else {
            console.warn(`SnapcastService: Client disconnected but not found in current state: ${disconnectParams.id}`);
          }
          break;


        case 'Group.OnMute':
          const gmParams = notification.params as GroupMuteChange;
          const groupMute = server.groups.find(g => g.id === gmParams.id);
          if (groupMute) groupMute.muted = gmParams.mute;
          break;

        case 'Group.OnStreamChanged':
          const gsParams = notification.params as GroupStreamChange;
          const groupStream = server.groups.find(g => g.id === gsParams.id);
          if (groupStream) {
            groupStream.stream_id = gsParams.stream_id;
            const stream = server.streams.find(s => s.id === gsParams.stream_id);
            if (stream) {
              console.log(`SnapcastService: Group ${groupStream.id} changed stream to ${stream.id}`);
            } else {
              console.warn(`SnapcastService: Stream ${gsParams.stream_id} not found for group ${groupStream.id}`);
            }
          } else {
            console.warn(`SnapcastService: Group ${gsParams.id} not found for stream change.`);
          }
          break;

        case 'Group.OnNameChanged':
          const gnParams = notification.params as GroupNameChange;
          const groupName = server.groups.find(g => g.id === gnParams.id);
          if (groupName) {
            groupName.name = gnParams.name;
            console.log(`SnapcastService: Group ${groupName.id} name changed to ${gnParams.name}`);
          } else {
            console.warn(`SnapcastService: Group ${gnParams.id} not found for name change.`);
          }
          break;

        case 'Stream.OnProperties':
          const streamProps = notification.params as StreamOnProperties;
          const stream = server.streams.find(s => s.id === streamProps.id);
          if (stream) {
            console.log(`SnapcastService: Stream ${stream.id} properties updated.`);
            console.log('SnapcastService: Stream properties details:', streamProps);
            stream.properties = { ...stream.properties, ...streamProps.properties };
          } else {
            console.warn(`SnapcastService: Stream ${streamProps.id} not found for properties update.`);
          }
          break;
        case 'Stream.OnUpdate':
          const streamUpdate = notification.params as StreamOnUpdate;
          const updatedStream = server.streams.find(s => s.id === streamUpdate.id);
          if (updatedStream) {
            console.log(`SnapcastService: Updating stream ${updatedStream.id} with new status and properties.`);
            console.log('SnapcastService: Stream update details:', streamUpdate);
            updatedStream.status = streamUpdate.stream.status;
            updatedStream.properties = { ...updatedStream.properties, ...streamUpdate.stream.properties };
          }
          break;
        case 'Server.OnUpdate':
          const serverUpdate = notification.params as ServerOnUpdateNotificationParams;
          if (serverUpdate.server) {
            console.log('SnapcastService: Server.OnUpdate received, replacing current state with new server data.');
            console.log('SnapcastService: Server update details:', serverUpdate);
            draft.server = serverUpdate.server;
          } else {
            console.warn('SnapcastService: Server.OnUpdate received but no server data found in notification.');
          }
          break;

        default:
          console.warn(`SnapcastService: Unhandled notification method: ${notification.method}`);
          break;
      }
    });

    // Emit the new, immutable state.
    this.stateSubject$.next(nextState);
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

  // --- Simplified Action Methods ---

  public setClientVolumePercent(clientId: string, percent: number): Observable<void> {
    if (percent < 0 || percent > 100) return throwError(() => new Error('Volume percentage must be between 0 and 100.'));

    // Get the current state ONCE to build the full RPC payload, as Snapcast API needs both percent and mute.
    return this.state$.pipe(
      take(1),
      switchMap(currentState => {
        const client = currentState?.server.groups.flatMap(g => g.clients).find(c => c.id === clientId);
        if (!client) return throwError(() => new Error(`Client ${clientId} not found in current state.`));

        const volumePayload: Volume = {
          percent: percent,
          muted: client.config.volume.muted // Use current mute status
        };
        return this.rpc('Client.SetVolume', { id: clientId, volume: volumePayload });
      }),
      map((): void => void 0), // Map successful RPC response to void
      catchError(err => {
        console.error(`SnapcastService: Failed to set volume for client ${clientId}`, err);
        return throwError(() => err);
      })
    );
  }

  public setClientMute(clientId: string, mute: boolean): Observable<void> {
    return this.state$.pipe(
      take(1),
      switchMap(currentState => {
        const client = currentState?.server.groups.flatMap(g => g.clients).find(c => c.id === clientId);
        if (!client) return throwError(() => new Error(`Client ${clientId} not found.`));

        const volumePayload: Volume = {
          percent: client.config.volume.percent, // Use current volume percent
          muted: mute,
        };
        return this.rpc('Client.SetVolume', { id: clientId, volume: volumePayload });
      }),
      map((): void => void 0),
      catchError(err => {
        console.error(`SnapcastService: Failed to set mute for client ${clientId}`, err);
        return throwError(() => err);
      })
    );
  }

  setGroupName(groupId: string, name: string): Observable<void> {
    return this.rpc('Group.SetName', { id: groupId, name }).pipe(
      map((): void => void 0),
      catchError(err => {
        console.error(`SnapcastService: Failed to set group name for group ${groupId}`, err);
        return throwError(() => err);
      })
    );
  }


  setGroupStream(groupId: string, streamId: string): Observable<void> {
    return this.rpc('Group.SetStream', { id: groupId, stream_id: streamId }).pipe(
      map(
        (): void => {
          console.log(`SnapcastService: Successfully set stream ${streamId} for group ${groupId}`);
          this.refreshState(); // Refresh state after setting stream
        }
      ),
      catchError(err => {
        console.error(`SnapcastService: Failed to set stream for group ${groupId}`, err);
        return throwError(() => err);
      })

    );

  }

  setClientName(clientId: string, name: string): Observable<void> {
    return this.rpc('Client.SetName', { id: clientId, name }).pipe(
      map((): void => void 0),
      catchError(err => {
        console.error(`SnapcastService: Failed to set name for client ${clientId}`, err);
        return throwError(() => err);
      })
    );
  }

  // TODO  ... Implement other action methods like.
  // They just need to call `this.rpc` with the correct parameters.

  // --- Data Access Helpers ---
  public getClient(clientId: string): Observable<Client | undefined> {
    return this.state$.pipe(map(state => state?.server?.groups.flatMap(g => g.clients).find(c => c.id === clientId)));
  }

  //  TODO: ... other get methods ...



  // --- Lifecycle and Disconnect ---

  public refreshState() {
    this.fetchInitialServerStatus();
  }

  public disconnect(): void {
    this.disconnectInternals(true);
    (this.isConnected$ as BehaviorSubject<boolean>).next(false);
  }
  private disconnectInternals(fullCleanup: boolean): void {
    if (this.ws$) { this.ws$.complete(); this.ws$ = undefined; }
    if (fullCleanup) { this.serviceSubscriptions.unsubscribe(); this.serviceSubscriptions = new Subscription(); }
  }
  ngOnDestroy(): void {
    this.disconnect();
    this.stateSubject$.complete();
    this.rpcResponses$.complete();
    (this.isConnected$ as BehaviorSubject<boolean>).complete();
  }
}