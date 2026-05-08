import { TestBed } from '@angular/core/testing';

import { PickingList } from './picking-list';

describe('PickingList', () => {
  let service: PickingList;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PickingList);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
