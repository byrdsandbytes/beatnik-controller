import { TestBed } from '@angular/core/testing';

import { BeatnikBlenoService } from './beatnik-bleno.service';

describe('BeatnikBlenoService', () => {
  let service: BeatnikBlenoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BeatnikBlenoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
