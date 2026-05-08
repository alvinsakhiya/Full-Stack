import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PickingLists } from './picking-lists';

describe('PickingLists', () => {
  let component: PickingLists;
  let fixture: ComponentFixture<PickingLists>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PickingLists],
    }).compileComponents();

    fixture = TestBed.createComponent(PickingLists);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
