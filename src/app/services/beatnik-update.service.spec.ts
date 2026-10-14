import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { BeatnikUpdateService } from './beatnik-update.service';

describe('BeatnikUpdateService', () => {
  let service: BeatnikUpdateService;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(BeatnikUpdateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
