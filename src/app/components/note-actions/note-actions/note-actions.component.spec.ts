import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NoteActionsComponent } from './note-actions.component';

describe('NoteActionsComponent', () => {
  let component: NoteActionsComponent;
  let fixture: ComponentFixture<NoteActionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NoteActionsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NoteActionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
