import { TestBed } from '@angular/core/testing';

import { CapMdnsService } from './cap-mdns.service';

describe('CapMdnsService', () => {
  let service: CapMdnsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CapMdnsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
