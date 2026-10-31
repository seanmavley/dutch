import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { DutchService } from './dutch.service';

describe('DutchService', () => {
  let service: DutchService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(DutchService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
