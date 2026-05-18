import { TestBed } from '@angular/core/testing';

import { StreamPresetsService } from './stream-presets.service';

describe('StreamPresetsService', () => {
  let service: StreamPresetsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(StreamPresetsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
