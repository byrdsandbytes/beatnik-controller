import { fakeAsync, TestBed, tick, flushMicrotasks } from '@angular/core/testing';
import { App, AppState } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { CamillaDspService, ConnectionStatus } from './camilla-dsp.service';

class FakeWebSocket extends EventTarget implements WebSocket {
  binaryType: BinaryType = 'blob';
  bufferedAmount = 0;
  extensions = '';
  protocol = '';
  readyState: number = 0;
  readonly CONNECTING = 0;
  readonly OPEN = 1;
  readonly CLOSING = 2;
  readonly CLOSED = 3;
  onopen: WebSocket['onopen'] = null;
  onclose: WebSocket['onclose'] = null;
  onerror: WebSocket['onerror'] = null;
  onmessage: WebSocket['onmessage'] = null;

  constructor(readonly url: string) { super(); }

  send(): void {}
  close(): void { this.readyState = this.CLOSED; }
  open(): void {
    this.readyState = this.OPEN;
    this.onopen?.call(this, new Event('open'));
  }
  serverClose(clean: boolean): void {
    this.readyState = this.CLOSED;
    this.onclose?.call(this, new CloseEvent('close', { wasClean: clean }));
  }
}

describe('CamillaDspService', () => {
  let service: CamillaDspService;
  let sockets: FakeWebSocket[];
  let statuses: ConnectionStatus[];
  let hidden: jasmine.Spy;

  beforeEach(() => {
    sockets = [];
    hidden = spyOnProperty(document, 'hidden', 'get').and.returnValue(false);
    spyOn(window, 'WebSocket').and.callFake(function (url: string | URL) {
      const socket = new FakeWebSocket(String(url));
      sockets.push(socket);
      return socket;
    });
    spyOn(Capacitor, 'isNativePlatform').and.returnValue(false);
    TestBed.configureTestingModule({});
    service = TestBed.inject(CamillaDspService);
    statuses = [];
    service.connectionStatus$.subscribe(status => statuses.push(status));
  });

  afterEach(() => service.ngOnDestroy());

  it('retries a clean server close and reconnects', fakeAsync(() => {
    service.acquire('ws://first:1234');
    sockets[0].open();
    sockets[0].serverClose(true);
    expect(statuses[statuses.length - 1]).toBe('Error');
    tick(5000);
    expect(sockets.length).toBe(2);
    expect(statuses[statuses.length - 1]).toBe('Connecting');
    sockets[1].open();
    expect(statuses[statuses.length - 1]).toBe('Connected');
    service.release();
  }));

  it('retries an unclean close and cancels retries on release', fakeAsync(() => {
    service.acquire('ws://first:1234');
    sockets[0].serverClose(false);
    expect(statuses[statuses.length - 1]).toBe('Error');
    service.release();
    tick(5000);
    expect(sockets.length).toBe(1);
    expect(statuses[statuses.length - 1]).toBe('Disconnected');
  }));

  it('retries when a connection attempt never opens', fakeAsync(() => {
    service.acquire('ws://first:1234');
    tick(10000);
    expect(statuses[statuses.length - 1]).toBe('Error');
    expect(sockets[0].readyState).toBe(sockets[0].CLOSED);
    tick(5000);
    expect(sockets.length).toBe(2);
    sockets[1].open();
    expect(statuses[statuses.length - 1]).toBe('Connected');
    service.release();
  }));

  it('reconnects on visibility return and ignores late closes from the old socket', () => {
    service.acquire('ws://first:1234');
    sockets[0].open();
    hidden.and.returnValue(true);
    document.dispatchEvent(new Event('visibilitychange'));
    expect(statuses[statuses.length - 1]).toBe('Disconnected');
    hidden.and.returnValue(false);
    document.dispatchEvent(new Event('visibilitychange'));
    expect(sockets.length).toBe(2);
    sockets[1].open();
    sockets[0].serverClose(true);
    expect(statuses[statuses.length - 1]).toBe('Connected');
    service.release();
    document.dispatchEvent(new Event('visibilitychange'));
    expect(sockets.length).toBe(2);
  });

  it('waits for the native app and document to both become active', fakeAsync(() => {
    (Capacitor.isNativePlatform as jasmine.Spy).and.returnValue(true);
    const remove = jasmine.createSpy('remove').and.resolveTo();
    const listener: jasmine.Spy = spyOn(App, 'addListener').and.returnValue(Promise.resolve({ remove }));
    service.acquire('ws://first:1234');
    flushMicrotasks();
    const onState: (state: AppState) => void = listener.calls.mostRecent().args[1];
    sockets[0].open();
    onState({ isActive: false });
    hidden.and.returnValue(true);
    document.dispatchEvent(new Event('visibilitychange'));
    onState({ isActive: true });
    expect(sockets.length).toBe(1);
    hidden.and.returnValue(false);
    document.dispatchEvent(new Event('visibilitychange'));
    expect(sockets.length).toBe(2);
    service.release();
    expect(remove).toHaveBeenCalled();
    flushMicrotasks();
  }));

  it('uses the new address when explicitly reconnecting', () => {
    service.acquire('ws://first:1234');
    sockets[0].open();
    service.reconnect('ws://second:1234');
    expect(sockets[1].url).toBe('ws://second:1234');
    sockets[1].open();
    sockets[0].serverClose(true);
    expect(statuses[statuses.length - 1]).toBe('Connected');
    service.release();
  });
});
