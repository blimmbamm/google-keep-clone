import {
  ApplicationRef,
  Component,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { NoteFormComponent } from '../note-form/note-form.component';
import { QueryService } from '../../services/query.service';
import {
  addNote,
  deleteNote,
  editNote,
  Note,
  NoteInput,
} from '../../../data/notes';
import { NavigationService } from '../../services/navigation.service';
import {
  BehaviorSubject,
  filter,
  fromEvent,
  map,
  skip,
  Subscription,
  takeWhile,
  tap,
} from 'rxjs';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { NoteActionsComponent } from '../note-actions/note-actions.component';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { LabelsStackComponent } from '../labels/labels-stack/labels-stack.component';
import { NoteManageLabelsActionComponent } from '../note-actions/note-manage-labels-action/note-manage-labels-action.component';
import { ChangeBackgroundColorActionComponent } from '../note-actions/change-background-color-action/change-background-color-action.component';
import { DeleteNoteActionDirective } from '../note-actions/delete-note-action/delete-note-action.directive';

@Component({
  selector: 'app-add-note',
  imports: [
    NoteFormComponent,
    NoteActionsComponent,
    MatButtonModule,
    MatIconModule,
    LabelsStackComponent,
    NoteManageLabelsActionComponent,
    ChangeBackgroundColorActionComponent,
    DeleteNoteActionDirective,
  ],
  templateUrl: './add-note.component.html',
  styleUrl: './add-note.component.scss',
  host: {
    '(click)': 'openAddNote()',
    '(mousedown)': 'doNotPropagate($event)',
    '[style.background-color]': 'noteColor()',
  },
})
export class AddNoteComponent {
  private appRef = inject(ApplicationRef);
  readonly queryService = inject(QueryService);
  readonly navigationService = inject(NavigationService);

  private noteFormComponent = viewChild.required(NoteFormComponent);

  /**
   * Whether the component is open/in extended mode, i.e. if it received a click
   */
  readonly open = signal(false);
  readonly open$ = toObservable(this.open);

  /** Initial note state */
  private INITIAL_NOTE_STATE = { note: null, initial: true, empty: true };

  /**
   * Tracking the state of the to be added note.
   *
   * If note gets added + optionally edited thereafter, it will be stored in `note`.
   *
   * `initial` means that the note hasn't been added yet.
   *
   * `empty` means that note has no title and no content set. Empty notes will be
   * discarded without further notification when 'blurring' the add-note component.
   */
  readonly noteState = signal<{
    note: Note | null;
    initial: boolean;
    empty: boolean;
  }>(this.INITIAL_NOTE_STATE);

  readonly noteColor = computed(
    () => this.noteState().note?.backgroundColor || 'inherit'
  );

  /** Whether deletion via delete action button requires user confirmation. */
  readonly deletionRequiresConfirmation = computed(
    () => !this.noteState().initial && !this.noteState().empty
  );

  /**
   * Subject that emits current idle status.
   *
   * This is needed because mutations (add/edit) are only triggered 300ms after
   * last key stroke. Any clean-up logic and deletion via delete action has to
   * wait until these 300ms are actual passed and the mutations have taken place.
   */
  readonly mutationsIdle$ = new BehaviorSubject(true);

  /**
   * Observable that emits when mutations idle status turns from false to true
   * and then automatically completes.
   */
  readonly mutationsTurnIdle$ = this.mutationsIdle$.pipe(
    takeWhile((idle) => !idle, true),
    filter((idle) => idle)
  );

  /** 
   * This observable emits the information if deletion requires user confirmation 
   * after mutations (add/edit) turn to idle status.
   */
  readonly deletionRequiresConfirmation$ = this.mutationsTurnIdle$.pipe(
    map(() => this.deletionRequiresConfirmation())
  );

  /**
   * Listen to clicks on root component in order to close the add note component.
   *
   * Listening to the document would fail because of overlays from dialogs etc.
   */
  private outsideClick$ = fromEvent(
    this.appRef.components[0].location.nativeElement,
    'mousedown'
  ).pipe(tap(() => this.open.set(false)));

  /**
   * Outside click stream gets subscribed when component is opened and unsubscribed
   * when closed.
   */
  private outsideClickSubscription?: Subscription;

  /**
   * Open signal state transformed to observable stream.
   *
   * When switching to opened, add listener for outside click.
   *
   * When switching to closed, clear added note if necessary.
   *
   * Skip initial emission of `false`.
   */
  _ = this.open$.pipe(skip(1), takeUntilDestroyed()).subscribe((open) => {
    // If opens, add listener for outside click,
    // if closes, do cleanup when add/edit mutations are done
    if (open) {
      this.outsideClickSubscription = this.outsideClick$.subscribe();
    } else {
      this.outsideClickSubscription?.unsubscribe();

      this.mutationsTurnIdle$.subscribe(() => {
        if (this.noteState().note && this.noteState().empty) {
          // If note is empty, delete it
          this.deleteNoteMutation.mutate(this.noteState().note!.id);
        } else if (this.noteState().note) {
          // If note is not empty, invalidate queries to display note
          this.queryService.refetchCurrentNotes();
        }

        this.resetComponent();
      });
    }
  });

  resetComponent() {
    // Reset noteState:
    this.noteState.set(this.INITIAL_NOTE_STATE);

    // Reset form:
    this.noteFormComponent().noteForm.reset(
      { title: '', content: '' },
      { emitEvent: false }
    );
  }

  handleDiscardNote() {
    this.resetComponent();
    this.handleClose();
  }

  handleClose(event?: MouseEvent) {
    event?.stopPropagation();

    this.open.set(false);
  }

  openAddNote() {
    this.open.set(true);
  }

  /** Do not propagate mousedown to outside-click handler */
  doNotPropagate(event: MouseEvent) {
    event.stopPropagation();
  }

  readonly addNoteMutation = this.queryService.useMutation({
    httpObsFn: (noteInput: NoteInput) => addNote(noteInput),
    onError: () => {},
    onSuccess: (note, noteInput) => {
      this.noteState.update((state) => ({
        ...state,
        note,
        empty: !noteInput.title && !noteInput.content,
        initial: false,
      }));

      this.mutationsIdle$.next(true);
    },
  });

  readonly editNoteMutation = this.queryService.useMutation({
    httpObsFn: (inputs: { id: number; noteInput: NoteInput }) =>
      editNote(inputs.id, inputs.noteInput),
    onError: () => {},
    onSuccess: (note, { noteInput }) => {
      this.noteState.update((state) => ({
        ...state,
        note,
        empty: !noteInput.title && !noteInput.content,
      }));

      this.mutationsIdle$.next(true);
    },
  });

  readonly deleteNoteMutation = this.queryService.useMutation({
    httpObsFn: (id: number) => deleteNote(id),
    onError: () => {},
    onSuccess: () => {},
  });

  /**
   * On first input change, add new note and flag it as not initial anymore
   * On any subsequent input chages, edit this previously added note
   */
  handleNoteInputChange(noteInput: NoteInput) {
    if (this.noteState().initial) {
      this.addNoteMutation.mutate(noteInput);
    } else {
      this.editNoteMutation.mutate({
        id: this.noteState().note!.id,
        noteInput,
      });
    }
  }

  /**
   * When value changes, set mutations as not idle, because they will be
   * triggered soon (after 300ms of debounce time).
   */
  ngAfterViewInit() {
    this.noteFormComponent().noteForm.valueChanges.subscribe(() => {
      this.mutationsIdle$.value && this.mutationsIdle$.next(false);
    });
  }
}
