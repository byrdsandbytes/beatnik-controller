import { TestBed } from '@angular/core/testing';

import { CoverDataService } from './cover-data.service';

describe('CoverDataService', () => {
  let service: CoverDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CoverDataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
