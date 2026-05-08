import { TestBed } from '@angular/core/testing';

import { Cycle } from './cycle';

describe('Cycle', () => {
  let service: Cycle;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Cycle);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
