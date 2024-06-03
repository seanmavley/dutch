import { TestBed } from '@angular/core/testing';

import { DutchService } from './dutch.service';

describe('DutchService', () => {
  let service: DutchService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DutchService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
