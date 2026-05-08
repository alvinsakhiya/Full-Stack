import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Medications } from './medications';

describe('Medications', () => {
  let component: Medications;
  let fixture: ComponentFixture<Medications>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Medications],
    }).compileComponents();

    fixture = TestBed.createComponent(Medications);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
