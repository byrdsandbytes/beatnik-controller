import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  webSocket,
  WebSocketSubject,
  WebSocketSubjectConfig,
} from 'rxjs/webSocket';
import {
  BehaviorSubject,
  Observable,
  Subject,
  Subscription,
  catchError,
  distinctUntilChanged,
  filter,
  map,
  take,
  tap,
  throwError,
  timer,
  EMPTY,
  shareReplay,
} from 'rxjs';
import { produce } from 'immer';
import { Preferences } from '@capacitor/preferences';
import { environment } from 'src/environments/environment';
import { UserPreference } from '../enum/user-preference.enum';

// --- Model Imports ---
import {
  SnapCastServerStatusResponse,
  Group,
  Client,
  Stream,
  ServerDetail,
  Volume,
  StreamLoopStatus,
  StreamControlRpcPayloadParams,
  StreamSetPropertyRpcPayloadParams,
  Server as SnapServerModel, // Alias to avoid confusion with ServerDetail
} from '../model/snapcast.model';

import {
  SnapcastWebsocketNotification,
  // Notification Payloads
  ClientVolumeChange,
  GroupMuteChange,
  GroupNameChange,
  GroupStreamChange,
  ServerOnUpdate as ServerOnUpdateNotificationParams,
  StreamOnProperties,
  StreamOnUpdate,
  ClientOnConnect,
  ClientOnDisconnect,
} from '../model/snapcast-websocket-notification.model';

// --- Type Definitions ---

interface JsonRpcRequest<P> {
  jsonrpc: '2.0';
  id: number;
  method: string;
  params?: P;
}

interface JsonRpcResponse<R> {
  jsonrpc: '2.0';
  id: number;
  result?: R;
  error?: { code: number; message: string };
}

// Strict RPC Method Registry
export interface SnapcastRpcMethods {
  'Server.GetStatus': { params: void; result: SnapCastServerStatusResponse };
  'Server.GetRpcVersion': {
    params: void;
    result: { major: number; minor: number; patch: number };
  };
  'Server.DeleteClient': { params: { id: string }; result: void };

  'Client.SetVolume': { params: { id: string; volume: Volume }; result: void };
  'Client.SetName': { params: { id: string; name: string }; result: void };
  'Client.SetLatency': {
    params: { id: string; latency: number };
    result: void;
  };
  'Client.GetStatus': { params: { id: string }; result: Client };

  'Group.SetMute': { params: { id: string; mute: boolean }; result: void };
  'Group.SetStream': {
    params: { id: string; stream_id: string };
    result: void;
  };
  'Group.SetClients': {
    params: { id: string; clients: string[] };
    result: void;
  };
  'Group.SetName': { params: { id: string; name: string }; result: void };
  'Group.GetStatus': { params: { id: string }; result: Group };

  'Stream.SetProperty': {
    params: StreamSetPropertyRpcPayloadParams;
    result: void;
  };
  'Stream.Control': { params: StreamControlRpcPayloadParams; result: void };
  'Stream.Add': { params: { stream: Stream }; result: void };
  'Stream.Remove': { params: { id: string }; result: void };
}

type SnapcastWebSocketMessage =
  | JsonRpcResponse<unknown>
  | SnapcastWebsocketNotification;

// --- Internal Classes & Functions ---

/**
 * Handles WebSocket connection, reconnection, and RPC request/response correlation.
 */
class JsonRpcSocket {
  private ws$?: WebSocketSubject<SnapcastWebSocketMessage>;
  private requestId = 0;

  // Public Streams
  public readonly notification$ = new Subject<SnapcastWebsocketNotification>();
  public readonly connected$ = new BehaviorSubject<boolean>(false);

  // Internal
  private readonly rpcResponses$ = new Subject<JsonRpcResponse<unknown>>();
  private socketSubscription: Subscription = new Subscription();
  private reconnectSubscription: Subscription = new Subscription();

  constructor(private reconnectIntervalMs: number = 3000) {}

  connect(url: string, onOpen?: () => void): void {
    if (this.ws$ && !this.ws$.closed) return;

    // Clean up previous attempts
    this.disconnect(false);

    const config: WebSocketSubjectConfig<SnapcastWebSocketMessage> = {
      url,
      openObserver: {
        next: () => {
          console.info(`[JsonRpcSocket] Connected to ${url}`);
          this.connected$.next(true);
          onOpen?.();
        },
      },
      closeObserver: {
        next: () => {
          console.warn(
            `[JsonRpcSocket] Closed. Reconnecting in ${this.reconnectIntervalMs}ms...`
          );
          this.connected$.next(false);
          this.ws$ = undefined;
          this.scheduleReconnect(url, onOpen);
        },
      },
      deserializer: (e) => {
        try {
          return JSON.parse(e.data);
        } catch (err) {
          console.error('JSON Parse Error', err);
          return null as any;
        }
      },
    };

    console.info(`[JsonRpcSocket] Connecting to ${url}...`);
    this.ws$ = webSocket(config);

    this.socketSubscription = this.ws$
      .pipe(
        catchError((err) => {
          console.error('[JsonRpcSocket] Stream Error', err);
          // The closeObserver will trigger reconnection logic
          return EMPTY;
        })
      )
      .subscribe({
        next: (msg) => this.handleMessage(msg),
        error: (err) => console.error('[JsonRpcSocket] Fatal Error', err),
      });
  }

  private scheduleReconnect(url: string, onOpen?: () => void) {
    this.reconnectSubscription.unsubscribe();
    this.reconnectSubscription = timer(this.reconnectIntervalMs)
      .pipe(take(1))
      .subscribe(() => {
        this.connect(url, onOpen);
      });
  }

  disconnect(emitState = true) {
    this.socketSubscription.unsubscribe();
    this.reconnectSubscription.unsubscribe();
    this.ws$?.complete();
    this.ws$ = undefined;
    if (emitState) this.connected$.next(false);
  }

  /**
   * Sends a strictly typed JSON-RPC request.
   */
  request<M extends keyof SnapcastRpcMethods>(
    method: M,
    params?: SnapcastRpcMethods[M]['params']
  ): Observable<SnapcastRpcMethods[M]['result']> {
    // Ensure we are connected before sending
    if (!this.ws$ || !this.connected$.value) {
      return throwError(() => new Error('WebSocket not connected'));
    }

    const id = ++this.requestId;
    // Cast params to any because optionality of params is hard to satisfy strictly in generic constraint
    const req: JsonRpcRequest<any> = { jsonrpc: '2.0', id, method, params };

    this.ws$.next(req as any);

    return this.rpcResponses$.pipe(
      filter((res) => res.id === id),
      take(1),
      map((res) => {
        if (res.error)
          throw new Error(`RPC Error ${res.error.code}: ${res.error.message}`);
        return res.result as SnapcastRpcMethods[M]['result'];
      })
    );
  }

  private handleMessage(msg: SnapcastWebSocketMessage) {
    if (!msg) return;

    // Check if Response (has ID)
    if ('id' in msg) {
      this.rpcResponses$.next(msg as JsonRpcResponse<unknown>);
    }
    // Check if Notification (has Method but no ID)
    else if ('method' in msg) {
      this.notification$.next(msg as SnapcastWebsocketNotification);
    }
  }
}

/**
 * Pure Reducer for Snapcast State using Immer
 */
function snapcastReducer(
  currentState: SnapCastServerStatusResponse | null,
  notification: SnapcastWebsocketNotification
): SnapCastServerStatusResponse | null {
  // If we receive a full update, replace state
  if (notification.method === 'Server.OnUpdate') {
    const params = notification.params as ServerOnUpdateNotificationParams;
    console.log('SnapcastService: Server.OnUpdate received.');
    return params.server ? { server: params.server } : currentState;
  }

  if (!currentState) return null;

  return produce(currentState, (draft) => {
    const server = draft.server;
    if (!server) return;

    switch (notification.method) {
      case 'Client.OnVolumeChanged': {
        const params = notification.params as ClientVolumeChange;
        const client = findClient(server, params.id);
        if (client) client.config.volume = params.volume;
        break;
      }
      case 'Client.OnConnect': {
        const params = notification.params as ClientOnConnect;
        console.log(`SnapcastService: Client connected: ${params.client.id}`);
        // Note: Proper handling requires inserting client into correct Group.
        // Since Group ID isn't provided in ClientOnConnect, we rely on Server.GetStatus refresh
        // which is triggered in the Service subscription.
        break;
      }
      case 'Client.OnDisconnect': {
        const params = notification.params as ClientOnDisconnect;
        const client = findClient(server, params.id);
        if (client) {
          client.connected = false;
          console.log(`SnapcastService: Client disconnected: ${params.id}`);
        }
        break;
      }
      case 'Client.OnNameChanged': {
        const params = notification.params as { id: string; name: string };
        const client = findClient(server, params.id);
        if (client) {
          client.config.name = params.name;
          console.log(
            `SnapcastService: Client ${params.id} name -> ${params.name}`
          );
        }
        break;
      }
      case 'Client.OnLatencyChanged': {
        const params = notification.params as { id: string; latency: number };
        const client = findClient(server, params.id);
        if (client) client.config.latency = params.latency;
        break;
      }
      case 'Group.OnMute': {
        const params = notification.params as GroupMuteChange;
        const group = server.groups.find((g) => g.id === params.id);
        if (group) group.muted = params.mute;
        break;
      }
      case 'Group.OnStreamChanged': {
        const params = notification.params as GroupStreamChange;
        const group = server.groups.find((g) => g.id === params.id);
        if (group) {
          group.stream_id = params.stream_id;
          console.log(
            `SnapcastService: Group ${params.id} stream -> ${params.stream_id}`
          );
        }
        break;
      }
      case 'Group.OnNameChanged': {
        const params = notification.params as GroupNameChange;
        const group = server.groups.find((g) => g.id === params.id);
        if (group) group.name = params.name;
        break;
      }
      case 'Stream.OnProperties': {
        const params = notification.params as StreamOnProperties;
        const stream = server.streams.find((s) => s.id === params.id);
        if (stream) {
          stream.properties = { ...stream.properties, ...params.properties };
        }
        break;
      }
      case 'Stream.OnUpdate': {
        const params = notification.params as StreamOnUpdate;
        const stream = server.streams.find((s) => s.id === params.id);
        if (stream) {
          stream.status = params.stream.status;
          stream.properties = params.stream.properties;
        }
        break;
      }
    }
  });
}

function findClient(
  server: SnapServerModel,
  clientId: string
): Client | undefined {
  for (const group of server.groups) {
    const client = group.clients.find((c) => c.id === clientId);
    if (client) return client;
  }
  return undefined;
}

@Injectable({ providedIn: 'root' })
export class SnapcastService implements OnDestroy {
  // --- Setup & State ---
  private readonly socket: JsonRpcSocket;
  private readonly _state =
    new BehaviorSubject<SnapCastServerStatusResponse | null>(null);

  // --- Public Observables ---
  public readonly state$ = this._state.asObservable();
  public readonly isConnected$: Observable<boolean>;

  public readonly groups$ = this.state$.pipe(
    map((s) => s?.server.groups || []),
    distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b))
  );
  public readonly streams$ = this.state$.pipe(
    map((s) => s?.server.streams || []),
    distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b))
  );
  public readonly serverDetails$ = this.state$.pipe(
    map((s) => s?.server.server),
    distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b))
  );

  constructor(private http: HttpClient) {
    this.socket = new JsonRpcSocket();
    this.isConnected$ = this.socket.connected$.asObservable();

    // Wire up the state reducer
    this.socket.notification$.subscribe((notification) => {
      const currentState = this._state.value;
      const newState = snapcastReducer(currentState, notification);

      if (newState !== currentState) {
        this._state.next(newState);
      }

      // Refresh full state on topology changes (Client connect/disconnect)
      // because the notification doesn't tell us which group the client belongs to
      if (
        notification.method === 'Client.OnConnect' ||
        notification.method === 'Client.OnDisconnect'
      ) {
        this.refreshState();
      }
    });
  }

  async connect(
    host = environment.snapcastServerUrl,
    port = 1780,
    overrideUserPreference = false
  ): Promise<void> {
    let finalHost = host;

    // Check User Preferences
    if (!overrideUserPreference) {
      const pref = await Preferences.get({ key: UserPreference.SERVER_URL });
      if (pref.value) finalHost = pref.value;
    }

    const wsUrl = `ws://${finalHost}:${port}/jsonrpc`;

    this.socket.connect(wsUrl, () => {
      // On Connect success:
      this.refreshState();
    });
  }

  public disconnect() {
    this.socket.disconnect();
  }

  public refreshState(): Observable<SnapCastServerStatusResponse> {
    const request$ = this.socket.request('Server.GetStatus', undefined).pipe(
      tap((res) => this._state.next(res)),
      shareReplay(1)
    );

    // Ensure subscription so the request is actually processed and state updated,
    // even if the caller ignores the return value.
    request$.subscribe({
      error: (err) =>
        console.error('SnapcastService: Failed to fetch state', err),
    });

    return request$;
  }

  // --- Public API (Strictly Typed) ---

  public setClientVolumePercent(id: string, percent: number): Observable<void> {
    if (percent < 0 || percent > 100)
      return throwError(() => new Error('Volume must be 0-100'));

    // We need the current mute status to send the full Volume object
    const client = this.findClientInState(id);
    if (!client)
      return throwError(() => new Error(`Client ${id} not found locally`));

    const volume: Volume = { percent, muted: client.config.volume.muted };
    return this.socket.request('Client.SetVolume', { id, volume });
  }

  public setClientName(id: string, name: string) {
    return this.socket.request('Client.SetName', { id, name });
  }

  public setClientLatency(id: string, latency: number) {
    if (latency < 0)
      return throwError(() => new Error('Latency must be positive'));
    return this.socket.request('Client.SetLatency', { id, latency });
  }

  public getClientStatus(id: string) {
    return this.socket.request('Client.GetStatus', { id });
  }

  public setGroupName(id: string, name: string) {
    return this.socket.request('Group.SetName', { id, name });
  }

  public setGroupStream(id: string, stream_id: string) {
    return this.socket.request('Group.SetStream', { id, stream_id }).pipe(
      tap(() => this.refreshState()) // Refresh to ensure Group state (streams) is consistent
    );
  }

  public setGroupClients(id: string, clients: string[]) {
    return this.socket.request('Group.SetClients', { id, clients });
  }

  public setGroupMute(id: string, mute: boolean) {
    return this.socket.request('Group.SetMute', { id, mute });
  }

  public getGroupStatus(id: string) {
    return this.socket.request('Group.GetStatus', { id });
  }

  public getServerStatus() {
    return this.socket.request('Server.GetStatus', undefined);
  }

  public getServerRpcVersion() {
    return this.socket.request('Server.GetRpcVersion', undefined);
  }

  public deleteServerClient(id: string) {
    return this.socket.request('Server.DeleteClient', { id });
  }

  public setStreamProperty(id: string, property: string, value: any) {
    return this.socket.request('Stream.SetProperty', { id, property, value });
  }

  public addStream(stream: Stream) {
    return this.socket.request('Stream.Add', { stream });
  }

  public removeStream(id: string) {
    return this.socket.request('Stream.Remove', { id });
  }

  // --- Helpers ---

  private findClientInState(id: string): Client | undefined {
    const s = this._state.value;
    if (!s) return undefined;
    return findClient(s.server, id);
  }

  public mockServerState() {
    const url = 'assets/mock/json/server-state.json';
    this.http
      .get<SnapCastServerStatusResponse>(url)
      .subscribe((s) => this._state.next(s));
  }

  ngOnDestroy() {
    this.disconnect();
    this._state.complete();
  }
}
