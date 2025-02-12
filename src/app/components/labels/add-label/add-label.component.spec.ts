import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddLabelComponent } from './add-label.component';

describe('AddLabelComponent', () => {
  let component: AddLabelComponent;
  let fixture: ComponentFixture<AddLabelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddLabelComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddLabelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
