import { TestBed } from '@angular/core/testing';

import { VolumePresetsService } from './volume-presets.service';

describe('VolumePresetsService', () => {
  let service: VolumePresetsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(VolumePresetsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
