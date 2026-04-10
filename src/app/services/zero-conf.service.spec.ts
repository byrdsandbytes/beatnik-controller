import { TestBed } from '@angular/core/testing';

import { ZeroconfService } from './zero-conf.service';

describe('ZeroconfService', () => {
  let service: ZeroconfService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ZeroconfService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
