import { Injectable, OnDestroy } from '@angular/core';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { Subject, Subscription, Observable, filter, map, shareReplay, firstValueFrom } from 'rxjs';
import { SnapCastServerStatusResponse } from '../model/snapcast.model';
import { SnapcastWebsocketNotificationService } from './snapcast-websocket-notification.service';

interface JsonRpcRequest<P = unknown> {
  jsonrpc: '2.0';
  id: number;
  method: string;
  params?: P;
}

interface JsonRpcResponse<R = unknown> {
  jsonrpc: '2.0';
  id: number;
  result?: R;
  error?: { code: number; message: string };
}

let rpcId = 1;

@Injectable({ providedIn: 'root' })
export class SnapcastService implements OnDestroy {
  private hostname = "byrds-audiopi.local";
  private ws$?: WebSocketSubject<unknown>;
  private responses$ = new Subject<JsonRpcResponse>();
  private status$ = new Subject<SnapCastServerStatusResponse>();
  private sub = new Subscription();

  public stausObservable?: Observable<SnapCastServerStatusResponse>;

  // public realtimeStatus?: Observable<SnapCastServerStatusResponse>

  constructor(
    private readonly snapcastWebsocketNotificationService: SnapcastWebsocketNotificationService,
  ) {
  }



  connect(host = this.hostname, port = 1780) {
    if (this.ws$ && !this.ws$.closed) return;

    this.ws$ = webSocket({ url: `ws://${host}:${port}/jsonrpc` });
    this.sub.add(this.ws$.subscribe(msg => this.route(msg)));

    this.rpc<never, SnapCastServerStatusResponse>('Server.GetStatus')
      .subscribe(r => this.status$.next(r.result!));
  }

  rpc<P, R>(method: string, params?: P): Observable<JsonRpcResponse<R>> {
    const id = rpcId++;
    this.ws$!.next({ jsonrpc: '2.0', id, method, ...(params && { params }) } as JsonRpcRequest);

    return this.responses$.pipe(
      filter(r => r.id === id),
      map(r => r as JsonRpcResponse<R>)
    );
  }

  get status(): Observable<SnapCastServerStatusResponse> {
    return this.status$.asObservable().pipe(shareReplay(1));
  }

  observeStatus(): Observable<SnapCastServerStatusResponse> {
    return this.status$.asObservable();
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
    this.ws$?.complete();
    console.log('SnapcastService destroyed');
  }

  private async route(msg: any) {

    console.log('Received message, routing:', msg);
    if (msg.id !== undefined) {
      console.log('Message id is defined');
      this.responses$.next(msg as JsonRpcResponse);
      const status = await firstValueFrom(this.status);
      const realtTimeState = this.snapcastWebsocketNotificationService.handleNotification(msg, status)
      this.status$.next(await realtTimeState);
    } else if (msg.method === 'Server.OnUpdate' && msg.params) {
      console.log('Message method is Server.OnUpdate');
      this.status$.next(msg.params as SnapCastServerStatusResponse);
    } else {
      console.warn('Received message without id', msg);
      const status = await firstValueFrom(this.status$);
      console.log('Current status before handling notification:', status);
      const realtTimeState = this.snapcastWebsocketNotificationService.handleNotification(msg, status);
      this.status$.next(await realtTimeState);
      console.log('Updated status after handling notification:', this.status$);
      // Handle other messages or ignore
    }
  }

  subscribeToWebSocket(): Observable<unknown> {
    if (!this.ws$) {
      throw new Error('WebSocket not connected. Call connect() first.');
    }
    return this.ws$.asObservable();
  }

  sendMessage(message: unknown): void {
    if (!this.ws$) {
      throw new Error('WebSocket not connected. Call connect() first.');
    }
    this.ws$.next(message);
  }


  subToSocket(host = this.hostname, port = 1780) {
    this.ws$ = webSocket({ url: `ws://${host}:${port}/jsonrpc` });
    this.ws$.subscribe(msg => {
      console.log('WebSocket message received:', msg);
    }
    );
    this.getStatus();

  }

  getStatus() {
    console.log('Requesting server status...');
    const status = this.rpc<never, SnapCastServerStatusResponse>('Server.GetStatus')
    status.subscribe(response => {
      console.log('Server status:', response);
      this.status$.next(response.result!);
    });
    this.stausObservable = this.status$.asObservable();
  }


}
