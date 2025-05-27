import { TestBed } from '@angular/core/testing';

import { SnapcastService } from './snapcast.service';

describe('SnapcastService', () => {
  let service: SnapcastService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SnapcastService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
