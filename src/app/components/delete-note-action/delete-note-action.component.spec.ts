import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeleteNoteActionComponent } from './delete-note-action.component';

describe('DeleteNoteActionComponent', () => {
  let component: DeleteNoteActionComponent;
  let fixture: ComponentFixture<DeleteNoteActionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeleteNoteActionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DeleteNoteActionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
