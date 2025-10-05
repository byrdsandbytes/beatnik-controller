import { TestBed } from '@angular/core/testing';

import { CamillaDspService } from './camilla-dsp.service';

describe('CamillaDspService', () => {
  let service: CamillaDspService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CamillaDspService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
