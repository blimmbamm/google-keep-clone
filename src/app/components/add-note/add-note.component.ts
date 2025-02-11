import { Component, inject, signal, viewChild } from '@angular/core';
import { NoteFormComponent } from '../note-form/note-form.component';
import { QueryService } from '../../services/query.service';
import { addNote, deleteNote, editNote, NoteInput } from '../../../data/notes';
import { NavigationService } from '../../services/navigation.service';
import { DOCUMENT } from '@angular/common';
import { fromEvent } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NoteActionsComponent } from '../note-actions/note-actions.component';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-add-note',
  imports: [
    NoteFormComponent,
    NoteActionsComponent,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './add-note.component.html',
  styleUrl: './add-note.component.scss',
  host: {
    '(click)': 'openAddNote($event)',
    '(mousedown)': 'doNotPropagate($event)',
  },
})
export class AddNoteComponent {
  private noteFormComponent = viewChild.required(NoteFormComponent);

  private document = inject(DOCUMENT);

  private INITIAL_NOTE_STATE = { id: null, initial: true, empty: true };

  private noteState = signal<{
    id: number | null;
    initial: boolean;
    empty: boolean;
  }>(this.INITIAL_NOTE_STATE);

  refetchNotes() {
    const { label, trash } = this.navigationService.notesParamsSnapshot();
    this.queryService.invalidateQuery(['notes', label, trash]);
  }

  _closeAddNoteSubscription = fromEvent(this.document, 'mousedown')
    .pipe(takeUntilDestroyed())
    .subscribe(() => {
      if (this.open()) {
        if (this.noteState().empty && !this.noteState().initial) {
          // If note is empty, delete it
          this.deleteNoteMutation.mutate(this.noteState().id!);
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
    event.stopPropagation();
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
    onSuccess: (noteId, noteInput) => {
      if (this.open()) {
        // If add note is still open, update note state:
        this.noteState.update((state) => ({
          ...state,
          id: noteId,
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
    onSuccess: (_, { noteInput }) => {      
      if (this.open()) {
        this.noteState.update((state) => ({
          ...state,
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
      this.editNoteMutation.mutate({ id: this.noteState().id!, noteInput });
    }

    // Set initial state to false, if still open
    if(this.open()) {
      this.noteState.update((state) => ({ ...state, initial: false }));
    }
  }
}
