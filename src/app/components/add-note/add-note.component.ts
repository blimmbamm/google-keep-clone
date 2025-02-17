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
  debounceTime,
  filter,
  fromEvent,
  merge,
  skip,
  Subscription,
  tap,
} from 'rxjs';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { NoteActionsComponent } from '../note-actions/note-actions.component';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { LabelsStackComponent } from '../labels/labels-stack/labels-stack.component';
import { NoteManageLabelsActionComponent } from '../note/note-manage-labels-action/note-manage-labels-action.component';
import { DeleteNoteActionComponent } from '../delete-note-action/delete-note-action.component';
import { ChangeBackgroundColorActionComponent } from '../note/change-background-color-action/change-background-color-action.component';

@Component({
  selector: 'app-add-note',
  imports: [
    NoteFormComponent,
    NoteActionsComponent,
    MatButtonModule,
    MatIconModule,
    LabelsStackComponent,
    NoteManageLabelsActionComponent,
    DeleteNoteActionComponent,
    ChangeBackgroundColorActionComponent,
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

  /**
   * Whether the component is open/in extended mode, i.e. if it received a click
   */
  readonly open = signal(false);
  readonly open$ = toObservable(this.open);

  private noteFormComponent = viewChild.required(NoteFormComponent);

  private INITIAL_NOTE_STATE = { note: null, initial: true, empty: true };

  readonly noteState = signal<{
    note: Note | null;
    initial: boolean;
    empty: boolean;
  }>(this.INITIAL_NOTE_STATE);

  readonly noteColor = computed(
    () => this.noteState().note?.backgroundColor || 'inherit'
  );

  readonly deletionRequiresConfirmation = computed(
    () => !this.noteState().initial && !this.noteState().empty
  );

  refetchNotes() {
    const { label, trash } = this.navigationService.notesParamsSnapshot();
    this.queryService.invalidateQuery(['notes', label, trash]);
  }

  /**
   * Listen to clicks on root component in order to close the add note component.
   *
   * Listening to the document would fail because of overlays from dialogs etc.
   */
  outsideClick$ = fromEvent(
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
   */
  _ = this.open$.pipe(takeUntilDestroyed()).subscribe((open) => {
    // if opens, add listener for outside click
    if (open) {
      this.outsideClickSubscription = this.outsideClick$.subscribe();
    } else {
      this.outsideClickSubscription?.unsubscribe();

      // If open changed to false, check if note has to be deleted or notes should be refetched
      if (this.noteState().empty && !this.noteState().initial) {
        // If note is empty, delete it
        this.deleteNoteMutation.mutate(this.noteState().note!.id);
      } else {
        // If note is not empty, invalidate queries to display note
        this.refetchNotes();
      }

      this.resetComponent();
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

  handleClose(event?: MouseEvent) {
    event?.stopPropagation();

    this.open.set(false);
  }

  openAddNote() {
    this.open.set(true);
  }

  doNotPropagate(event: MouseEvent) {
    event.stopPropagation();
  }

  readonly queryService = inject(QueryService);
  readonly navigationService = inject(NavigationService);

  readonly addNoteMutation = this.queryService.useMutation({
    httpObsFn: (noteInput: NoteInput) => addNote(noteInput),
    onError: () => {},
    onSuccess: (note, noteInput) => {
      if (this.open()) {
        // If add note is still open, update note state:
        this.noteState.update((state) => ({
          ...state,
          note,
          empty: !noteInput.title && !noteInput.content,
        }));
      } else {
        // Refetch notes only if add note was closed in the meantime
        this.refetchNotes();
      }
    },
  });

  readonly editNoteMutation = this.queryService.useMutation({
    httpObsFn: (inputs: { id: number; noteInput: NoteInput }) =>
      editNote(inputs.id, inputs.noteInput),
    onError: () => {},
    onSuccess: (note, { noteInput }) => {
      if (this.open()) {
        this.noteState.update((state) => ({
          ...state,
          note,
          empty: !noteInput.title && !noteInput.content,
        }));
      } else {
        // Refetch notes only if add note was closed in the meantime
        this.refetchNotes();
      }
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

    // Set initial state to false, if still open
    if (this.open()) {
      this.noteState.update((state) => ({ ...state, initial: false }));
    }
  }
}
