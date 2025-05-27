import { TestBed } from '@angular/core/testing';

import { SnapcastWebsocketNotificationService } from './snapcast-websocket-notification.service';

describe('SnapcastWebsocketNotificationService', () => {
  let service: SnapcastWebsocketNotificationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SnapcastWebsocketNotificationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
