import { TestBed } from '@angular/core/testing';

import { BeatnikHardwareService } from './beatnik-hardware.service';

describe('BeatnikHardwareService', () => {
  let service: BeatnikHardwareService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BeatnikHardwareService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
