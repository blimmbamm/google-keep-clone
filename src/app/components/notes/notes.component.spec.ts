import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NotesComponent } from './notes.component';
import { QueryService } from '../../services/query.service';
import { NavigationService } from '../../services/navigation.service';
import { NoteComponent } from '../note/note.component';
import { AddNoteComponent } from '../add-note/add-note.component';
import { MatIconModule } from '@angular/material/icon';
import { AsyncPipe } from '@angular/common';
import { BehaviorSubject, of, Subject } from 'rxjs';
import { By } from '@angular/platform-browser';
import { Component, input } from '@angular/core';
import { DUMMY_NOTES, Note } from '../../../data/notes';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-add-note',
  template: '',
})
class AddNoteMockComponent {}

@Component({
  selector: 'app-note',
  template: '',
})
class NoteMockComponent {
  readonly note = input<Note>(DUMMY_NOTES[0]);
}

describe('NotesComponent', () => {
  let component: NotesComponent;
  let fixture: ComponentFixture<NotesComponent>;
  let queryService: QueryService;
  let navigationService: NavigationService;

  const queryMock = {
    data$: new Subject<Note[]>(),
    loading$: new BehaviorSubject(false),
    error$: new BehaviorSubject<HttpErrorResponse | null>(null),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        NotesComponent,
        NoteComponent,
        AddNoteComponent,
        MatIconModule,
        AsyncPipe,
      ],
      providers: [
        {
          provide: QueryService,
          useValue: {
            useParametrizedQuery: () => queryMock,
            getNotesQueryKey: jasmine
              .createSpy('getNotesQueryKey')
              .and.returnValue(['notes']),
          },
        },
        {
          provide: NavigationService,
          useValue: {
            notesParamsObs$: of({
              labelName: 'Non-existent label',
              trash: false,
            }),
          },
        },
      ],
    })
      .overrideComponent(NotesComponent, {
        remove: { imports: [AddNoteComponent, NoteComponent] },
        add: { imports: [AddNoteMockComponent, NoteMockComponent] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(NotesComponent);
    component = fixture.componentInstance;
    queryService = TestBed.inject(QueryService);
    navigationService = TestBed.inject(NavigationService);
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should render app-add-note when not in trash mode', () => {
    const addNoteElement = fixture.debugElement.query(By.css('app-add-note'));
    expect(addNoteElement).toBeTruthy();
  });

  it('should not render app-add-note when in trash mode', () => {
    (navigationService.notesParamsObs$ as any) = of({
      labelName: null,
      trash: true,
    });
    fixture.detectChanges();
    const addNoteElement = fixture.debugElement.query(By.css('app-add-note'));
    expect(addNoteElement).toBeFalsy();
  });

  it('should render app-note components based on notes data', () => {
    queryMock.data$.next(DUMMY_NOTES);

    fixture.detectChanges();
    const noteElements = fixture.debugElement.queryAll(By.css('app-note'));
    expect(noteElements.length).toBe(DUMMY_NOTES.length);
  });

  it('should render fallback message when there are no notes', () => {
    queryMock.data$.next([]);
    fixture.detectChanges();
    const fallbackElement = fixture.debugElement.query(By.css('.fallback'));
    expect(fallbackElement).toBeTruthy();
  });

  it('should render label-specific fallback message when there are no notes with that label', () => {
    // Emit empty notes array - notesParams labelName is set to not exist
    queryMock.data$.next([]);
    fixture.detectChanges();
    const fallbackElement = fixture.debugElement.query(By.css('.fallback'));
    expect(fallbackElement.nativeElement.textContent).toContain(
      'No notes with this label yet'
    );
  });

  it('should render general fallback message when there is no label and no notes', () => {
    // Manually override readonly property by casting to any
    (navigationService.notesParamsObs$ as any) = of({
      labelName: null,
      trash: false,
    });

    queryMock.data$.next([]);
    fixture.detectChanges();
    const fallbackElement = fixture.debugElement.query(By.css('.fallback'));
    expect(fallbackElement.nativeElement.textContent).toContain('No notes yet');
  });
});
