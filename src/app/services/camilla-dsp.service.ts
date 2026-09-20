import { Injectable, OnDestroy } from '@angular/core';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { Subject, Observable, BehaviorSubject, timer, Subscription } from 'rxjs';
import { retry, filter, map, takeUntil } from 'rxjs/operators';

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

  // Public observables for components to subscribe to
  public messages$: Observable<any> = this.messagesSubject.asObservable();
  public connectionStatus$: Observable<ConnectionStatus> = this.connectionStatusSubject.asObservable();
  public signalLevels$: Observable<any>;
  private levelUpdateIntervalId: any;

  constructor() {
    this.signalLevels$ = this.messages$.pipe(
      filter(msg => (msg && msg.SignalLevels) || (msg && (msg.GetSignalLevels && msg.GetSignalLevels.value))),
      map(msg => msg.SignalLevels ? msg.SignalLevels : msg.GetSignalLevels.value)
    );
  }

  /**
   * Establishes a connection to the CamillaDSP WebSocket server.
   * Safe to call multiple times - ignored while already connected/connecting/retrying,
   * to avoid stacking up duplicate sockets and subscriptions.
   * @param url The full WebSocket URL (e.g., 'ws://beatnik-client-amp.local:1234')
   */
  public connect(url: string): void {
    if (this.connectionStatusSubject.value !== 'Disconnected') {
      console.log('CamillaDSP already connected/connecting; ignoring duplicate connect() call.');
      return;
    }

    this.connectionStatusSubject.next('Connecting');
    console.log(`Connecting to ${url}...`);

    this.socket$ = webSocket({
      url: url,
      openObserver: {
        next: () => {
          console.log('WebSocket connection established successfully! 🎉');
          this.connectionStatusSubject.next('Connected');
        },
      },
      closeObserver: {
        next: () => {
          console.log('WebSocket connection closed.');
          this.connectionStatusSubject.next('Disconnected');
        },
      },
    });

    this.pipelineSubscription = this.socket$
      .pipe(
        // Retries indefinitely with a fixed delay; takeUntil below lets disconnect() cancel it
        retry({
          delay: err => {
            console.error(`Connection error: ${err}. Retrying in ${this.RECONNECT_INTERVAL_MS / 1000}s...`);
            this.connectionStatusSubject.next('Error');
            return timer(this.RECONNECT_INTERVAL_MS);
          },
        }),
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

  /**
   * Sends a command to the CamillaDSP server.
   * @param command The command name (e.g., 'GetState', 'SetConfigJson').
   * @param params Optional parameters for the command.
   */
  public sendCommand(command: string, params: any = null): void {
    if (this.connectionStatusSubject.value !== 'Connected' || !this.socket$) {
      console.warn('Cannot send command while not connected.');
      return;
    }

    // CamillaDSP expects a JSON object where the key is the command name
    const commandToSend: CamillaDspCommand = { [command]: params };
    
    console.log('Sending command:', commandToSend);
    this.socket$.next(commandToSend);
  }

  /**
   * Tells CamillaDSP to start sending SignalLevels messages periodically.
   * Uses polling via 'GetSignalLevels' as reliable fallback if push is not available.
   * @param intervalMs The update interval in milliseconds.
   */
  public startLevelUpdates(intervalMs: number): void {
    this.stopLevelUpdates(); // Clear any existing interval
    
    // Also set the calculation interval on the server just in case
    if (intervalMs > 0) {
      this.sendCommand('SetUpdateInterval', intervalMs);
      
      // Setup client-side polling
      this.levelUpdateIntervalId = setInterval(() => {
          this.sendCommand('GetSignalLevels');
      }, intervalMs);
    }
  }

  /**
   * Tells CamillaDSP to stop sending SignalLevels messages.
   */
  public stopLevelUpdates(): void {
    if (this.levelUpdateIntervalId) {
        clearInterval(this.levelUpdateIntervalId);
        this.levelUpdateIntervalId = null;
    }
    this.sendCommand('SetUpdateInterval', 0);
  }

  /**
   * Closes the WebSocket connection gracefully and cancels any pending reconnect attempt.
   */
  public disconnect(): void {
    this.stopLevelUpdates();
    this.stopReconnect$.next(); // cancel any in-flight retry delay so it doesn't reconnect afterwards
    this.pipelineSubscription?.unsubscribe();
    this.pipelineSubscription = null;
    if (this.socket$ && !this.socket$.closed) {
      this.socket$.complete(); // This will trigger the closeObserver
    }
    this.socket$ = null;
    this.connectionStatusSubject.next('Disconnected');
  }

  ngOnDestroy(): void {
    this.disconnect();
    this.messagesSubject.complete();
    this.connectionStatusSubject.complete();
    this.stopReconnect$.complete();
  }
}
