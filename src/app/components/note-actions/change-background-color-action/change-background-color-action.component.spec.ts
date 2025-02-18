import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChangeBackgroundColorActionComponent } from './change-background-color-action.component';

describe('ChangeBackgroundColorActionComponent', () => {
  let component: ChangeBackgroundColorActionComponent;
  let fixture: ComponentFixture<ChangeBackgroundColorActionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChangeBackgroundColorActionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChangeBackgroundColorActionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
