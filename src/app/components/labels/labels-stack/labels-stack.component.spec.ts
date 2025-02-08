import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LabelsStackComponent } from './labels-stack.component';

describe('LabelsStackComponent', () => {
  let component: LabelsStackComponent;
  let fixture: ComponentFixture<LabelsStackComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LabelsStackComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LabelsStackComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
