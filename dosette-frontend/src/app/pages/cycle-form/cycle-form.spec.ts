import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CycleForm } from './cycle-form';

describe('CycleForm', () => {
  let component: CycleForm;
  let fixture: ComponentFixture<CycleForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CycleForm],
    }).compileComponents();

    fixture = TestBed.createComponent(CycleForm);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
