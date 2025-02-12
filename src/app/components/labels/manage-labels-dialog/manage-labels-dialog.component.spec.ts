import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManageLabelsDialogComponent } from './manage-labels-dialog.component';

describe('ManageLabelsDialogComponent', () => {
  let component: ManageLabelsDialogComponent;
  let fixture: ComponentFixture<ManageLabelsDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManageLabelsDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ManageLabelsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
