import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { App } from '@capacitor/app';
import { Capacitor, PluginListenerHandle } from '@capacitor/core';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { Subject, Observable, BehaviorSubject, timer, Subscription } from 'rxjs';
import { retry, repeat, filter, map, takeUntil, tap } from 'rxjs/operators';

// Defines the possible connection states
export type ConnectionStatus = 'Connected' | 'Connecting' | 'Disconnected' | 'Error';

// A simple type for the JSON commands CamillaDSP expects
// Example: { "command": "GetState", "params": null }
interface CamillaDspCommand {
  [command: string]: any;
}

@Injectable({
  providedIn: 'root',
})
export class CamillaDspService implements OnDestroy {
  private socket$: WebSocketSubject<any> | null = null;
  private pipelineSubscription: Subscription | null = null;
  // Emits to cancel any in-flight reconnect attempt (e.g. on manual disconnect)
  private readonly stopReconnect$ = new Subject<void>();
  private messagesSubject = new Subject<any>();
  private connectionStatusSubject = new BehaviorSubject<ConnectionStatus>('Disconnected');
  private readonly RECONNECT_INTERVAL_MS = 5000;
  private readonly CONNECT_TIMEOUT_MS = 10000;
  private consumers = 0;
  private desiredUrl: string | null = null;
  private nativeActive = true;
  private lifecycleGeneration = 0;
  private lifecycleListener?: PluginListenerHandle;
  private connectionGeneration = 0;
  private readonly visibilityListener = () => this.updateAppActivity();

  // Public observables for components to subscribe to
  public messages$: Observable<any> = this.messagesSubject.asObservable();
  public connectionStatus$: Observable<ConnectionStatus> = this.connectionStatusSubject.asObservable();
  public signalLevels$: Observable<any>;
  private levelTimer: ReturnType<typeof setTimeout> | null = null;
  private levelWatchdog: ReturnType<typeof setTimeout> | null = null;
  private levelPollingMs = 0;
  private levelRequestInFlight = false;
  // CamillaDSP < 3 has no *SinceLast command; fall back to plain GetSignalLevels if it errors
  private levelCommand = 'GetSignalLevelsSinceLast';
  private readonly LEVEL_REPLY_TIMEOUT_MS = 1000;

  constructor(private zone: NgZone) {
    this.signalLevels$ = this.messages$.pipe(
      map(msg => this.extractLevels(msg)),
      filter((levels): levels is any => !!levels)
    );
    // Every reply (data, empty, or error) ends the in-flight request and schedules the next poll
    this.messages$.subscribe(msg => this.onLevelReply(msg));
  }

  private extractLevels(msg: any): any | null {
    const reply = msg?.GetSignalLevelsSinceLast ?? msg?.GetSignalLevels;
    const value = reply?.value;
    // SinceLast answers with an empty list when there is no new data yet
    return value && !Array.isArray(value) && value.playback_rms ? value : null;
  }

  private onLevelReply(msg: any): void {
    const isLevelReply = msg && (msg.GetSignalLevelsSinceLast || msg.GetSignalLevels);
    if (!isLevelReply || !this.levelPollingMs) {
      return;
    }
    if (msg.GetSignalLevelsSinceLast?.result === 'Error' && this.levelCommand === 'GetSignalLevelsSinceLast') {
      this.levelCommand = 'GetSignalLevels';
    }
    this.levelRequestInFlight = false;
    this.scheduleNextLevelPoll();
  }

  /**
   * Establishes a connection to the CamillaDSP WebSocket server.
   * Safe to call multiple times - ignored while already connected/connecting/retrying,
   * to avoid stacking up duplicate sockets and subscriptions.
   * @param url The full WebSocket URL (e.g., 'ws://beatnik-client-amp.local:1234')
   */
  public connect(url: string): void {
    this.desiredUrl = url;
    if (!this.isAppActive()) {
      return;
    }
    if (this.connectionStatusSubject.value !== 'Disconnected') {
      console.log('CamillaDSP already connected/connecting; ignoring duplicate connect() call.');
      return;
    }

    const generation = ++this.connectionGeneration;
    let connectWatchdog: ReturnType<typeof setTimeout> | undefined;
    this.connectionStatusSubject.next('Connecting');
    console.log(`Connecting to ${url}...`);

    this.socket$ = webSocket({
      url: url,
      openObserver: {
        next: () => {
          if (generation !== this.connectionGeneration) { return; }
          clearTimeout(connectWatchdog);
          console.log('WebSocket connection established successfully! 🎉');
          this.connectionStatusSubject.next('Connected');
        },
      },
    });

    const socket = this.socket$;
    this.pipelineSubscription = new Observable<any>(observer => {
      connectWatchdog = setTimeout(() => {
        observer.error(new Error(`CamillaDSP connection to ${url} timed out`));
      }, this.CONNECT_TIMEOUT_MS);
      const subscription = socket.subscribe(observer);
      return () => {
        clearTimeout(connectWatchdog);
        subscription.unsubscribe();
      };
    })
      .pipe(
        // Retries indefinitely with a fixed delay; takeUntil below lets disconnect() cancel it
        retry({
          delay: err => {
            console.error(`Connection error: ${err}. Retrying in ${this.RECONNECT_INTERVAL_MS / 1000}s...`);
            return this.retryDelay(generation);
          },
        }),
        repeat({ delay: () => {
          console.warn('CamillaDSP connection closed. Retrying...');
          return this.retryDelay(generation);
        } }),
        takeUntil(this.stopReconnect$)
      )
      .subscribe({
        next: msg => this.messagesSubject.next(msg), // Forward messages to our subject
        error: err => {
          console.error('WebSocket unrecoverable error:', err);
          this.connectionStatusSubject.next('Error');
        },
      });
  }

  private retryDelay(generation: number): Observable<number> {
    this.connectionStatusSubject.next('Error');
    return timer(this.RECONNECT_INTERVAL_MS).pipe(
      tap(() => {
        if (generation === this.connectionGeneration) {
          this.connectionStatusSubject.next('Connecting');
        }
      })
    );
  }

  /**
   * Sends a command to the CamillaDSP server.
   * @param command The command name (e.g., 'GetState', 'SetConfigJson').
   * @param params Optional parameters for the command.
   */
  public sendCommand(command: string, params: any = null, quiet = false): void {
    if (this.connectionStatusSubject.value !== 'Connected' || !this.socket$) {
      console.warn('Cannot send command while not connected.');
      return;
    }

    // CamillaDSP expects a JSON object where the key is the command name
    const commandToSend: CamillaDspCommand = { [command]: params };
    
    if (!quiet) {
      console.log('Sending command:', commandToSend);
    }
    this.socket$.next(commandToSend);
  }

  /**
   * Starts reading signal levels. CamillaDSP's websocket is request/response only (it has no push),
   * so this polls with one request at a time: the next one is only sent after the previous reply
   * arrived, so slow links never build up a backlog. GetSignalLevelsSinceLast returns the peak/RMS
   * since our previous request, so short peaks between polls are not missed.
   * @param intervalMs Minimum pause between a reply and the next request.
   */
  public startLevelUpdates(intervalMs: number): void {
    this.stopLevelUpdates();
    if (intervalMs <= 0) {
      return;
    }
    this.levelPollingMs = intervalMs;
    this.pollLevels();
  }

  public stopLevelUpdates(): void {
    this.levelPollingMs = 0;
    this.levelRequestInFlight = false;
    clearTimeout(this.levelTimer ?? undefined);
    clearTimeout(this.levelWatchdog ?? undefined);
    this.levelTimer = null;
    this.levelWatchdog = null;
  }

  private pollLevels(): void {
    this.levelTimer = null;
    if (!this.levelPollingMs || this.connectionStatusSubject.value !== 'Connected') {
      return;
    }
    // Nothing to show while the app is in the background, check again shortly
    if (typeof document !== 'undefined' && document.hidden) {
      this.levelTimer = setTimeout(() => this.pollLevels(), 500);
      return;
    }
    this.levelRequestInFlight = true;
    this.sendCommand(this.levelCommand, null, true);
    // If the reply never arrives (dropped message), keep polling instead of stalling forever
    this.levelWatchdog = setTimeout(() => {
      this.levelRequestInFlight = false;
      this.scheduleNextLevelPoll();
    }, this.LEVEL_REPLY_TIMEOUT_MS);
  }

  private scheduleNextLevelPoll(): void {
    clearTimeout(this.levelWatchdog ?? undefined);
    this.levelWatchdog = null;
    if (!this.levelPollingMs || this.levelRequestInFlight || this.levelTimer) {
      return;
    }
    this.levelTimer = setTimeout(() => this.pollLevels(), this.levelPollingMs);
  }

  /** Connects (if needed) on behalf of a component; pair every call with release(). */
  public acquire(url: string): void {
    this.consumers++;
    if (this.consumers === 1) {
      this.startLifecycleListeners();
    }
    this.connect(url);
  }

  /** Drops one consumer and closes the connection once nobody uses it anymore. */
  public release(): void {
    this.consumers = Math.max(0, this.consumers - 1);
    if (this.consumers === 0) {
      this.disconnect();
      this.stopLifecycleListeners();
    }
  }

  private isAppActive(): boolean {
    return this.nativeActive && (typeof document === 'undefined' || !document.hidden);
  }

  private startLifecycleListeners(): void {
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this.visibilityListener);
    }
    if (Capacitor.isNativePlatform()) {
      const generation = ++this.lifecycleGeneration;
      App.addListener('appStateChange', state => this.zone.run(() => {
        if (generation !== this.lifecycleGeneration) { return; }
        this.nativeActive = state.isActive;
        this.updateAppActivity();
      })).then(handle => {
        if (generation !== this.lifecycleGeneration) {
          void handle.remove().catch(error =>
            console.error('Failed to remove CamillaDSP app lifecycle listener:', error));
        } else {
          this.lifecycleListener = handle;
        }
      }).catch(error => console.error('Failed to monitor CamillaDSP app lifecycle:', error));
    }
  }

  private stopLifecycleListeners(): void {
    ++this.lifecycleGeneration;
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.visibilityListener);
    }
    if (this.lifecycleListener) {
      void this.lifecycleListener.remove().catch(error =>
        console.error('Failed to remove CamillaDSP app lifecycle listener:', error));
      this.lifecycleListener = undefined;
    }
    this.nativeActive = true;
  }

  private updateAppActivity(): void {
    if (!this.desiredUrl) { return; }
    if (!this.isAppActive()) {
      this.stopConnection();
    } else {
      this.connect(this.desiredUrl);
    }
  }

  /**
   * Closes the WebSocket connection gracefully and cancels any pending reconnect attempt.
   */
  public disconnect(): void {
    this.desiredUrl = null;
    this.stopConnection();
  }

  private stopConnection(): void {
    ++this.connectionGeneration;
    this.stopLevelUpdates();
    this.stopReconnect$.next(); // cancel any in-flight retry delay so it doesn't reconnect afterwards
    this.pipelineSubscription?.unsubscribe();
    this.pipelineSubscription = null;
    if (this.socket$ && !this.socket$.closed) {
      this.socket$.complete();
    }
    this.socket$ = null;
    this.connectionStatusSubject.next('Disconnected');
  }

  /**
   * Drops the current connection (and any pending retry) and connects again.
   * Used by the "Retry" action so an edited URL is picked up immediately.
   */
  public reconnect(url: string): void {
    this.disconnect();
    this.connect(url);
  }

  ngOnDestroy(): void {
    this.disconnect();
    this.stopLifecycleListeners();
    this.messagesSubject.complete();
    this.connectionStatusSubject.complete();
    this.stopReconnect$.complete();
  }
}
