import { TestBed } from '@angular/core/testing';

import { ZeroConfService } from './zero-conf.service';

describe('ZeroConfService', () => {
  let service: ZeroConfService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ZeroConfService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
