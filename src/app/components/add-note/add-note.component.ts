import {
  ApplicationRef,
  Component,
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
import { fromEvent } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NoteActionsComponent } from '../note-actions/note-actions.component';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { LabelsStackComponent } from '../labels/labels-stack/labels-stack.component';
import { NoteManageLabelsActionComponent } from '../note/note-manage-labels-action/note-manage-labels-action.component';

@Component({
  selector: 'app-add-note',
  imports: [
    NoteFormComponent,
    NoteActionsComponent,
    MatButtonModule,
    MatIconModule,
    LabelsStackComponent,
    NoteManageLabelsActionComponent,
  ],
  templateUrl: './add-note.component.html',
  styleUrl: './add-note.component.scss',
  host: {
    '(click)': 'openAddNote($event)',
    '(mousedown)': 'doNotPropagate($event)',
  },
})
export class AddNoteComponent {
  private appRef = inject(ApplicationRef);

  private noteFormComponent = viewChild.required(NoteFormComponent);

  private INITIAL_NOTE_STATE = { note: null, initial: true, empty: true };

  readonly noteState = signal<{
    note: Note | null;
    initial: boolean;
    empty: boolean;
  }>(this.INITIAL_NOTE_STATE);

  refetchNotes() {
    const { label, trash } = this.navigationService.notesParamsSnapshot();
    this.queryService.invalidateQuery(['notes', label, trash]);
  }

  /**
   * Listen to clicks on root component in order to close the add note component,
   * and either delete the note that was temporarily saved or refetch notes
   * to display the new one.
   *
   * Listening to the document would fail because of overlays from dialogs etc.
   */
  _closeAddNoteSubscription = fromEvent(
    this.appRef.components[0].location.nativeElement,
    'mousedown'
  )
    .pipe(takeUntilDestroyed())
    .subscribe(() => {
      if (this.open()) {
        if (this.noteState().empty && !this.noteState().initial) {
          // If note is empty, delete it
          this.deleteNoteMutation.mutate(this.noteState().note!.id);
        } else {
          // If note is not empty, invalidate queries to display note
          this.refetchNotes();
        }

        // Reset noteState:
        this.noteState.set(this.INITIAL_NOTE_STATE);

        // Reset form:
        this.noteFormComponent().noteForm.reset(
          { title: '', content: '' },
          { emitEvent: false }
        );

        // Close add note:
        this.open.set(false);
      }
    });

  readonly open = signal(false);

  openAddNote(event: MouseEvent) {
    // event.stopPropagation();
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
