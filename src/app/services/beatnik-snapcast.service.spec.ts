import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { BeatnikSnapcastService } from './beatnik-snapcast.service';

describe('BeatnikSnapcastService', () => {
  let service: BeatnikSnapcastService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    service = TestBed.inject(BeatnikSnapcastService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
