import {
  ApplicationRef,
  Component,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { fromEvent, skip, Subscription, tap } from 'rxjs';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

import { NoteFormComponent } from '../note-form/note-form.component';
import { Note, NoteInput } from '../../../data/notes';
import { NavigationService } from '../../services/navigation.service';
import { NoteActionsComponent } from '../note-actions/note-actions/note-actions.component';
import { LabelsStackComponent } from '../labels/labels-stack/labels-stack.component';
import { NoteManageLabelsActionComponent } from '../note-actions/note-manage-labels-action/note-manage-labels-action.component';
import { ChangeBackgroundColorActionComponent } from '../note-actions/change-background-color-action/change-background-color-action.component';
import { DeleteNoteActionDirective } from '../note-actions/delete-note-action/delete-note-action.directive';
import { NotesService } from '../../services/notes/notes.service';
import { LabelsService } from '../../services/labels/labels.service';

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
    MatTooltipModule,
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
  readonly navigationService = inject(NavigationService);
  private notesService = inject(NotesService);
  private labelsService = inject(LabelsService);

  private noteFormComponent = viewChild.required(NoteFormComponent);

  /**
   * Outside click stream gets subscribed when component is opened and unsubscribed
   * when closed.
   */
  private outsideClickSubscription?: Subscription;

  /**
   * Whether the component is open/in extended mode, i.e. if it received a click
   */
  readonly open = signal(false);
  readonly open$ = toObservable(this.open);

  /** Whether component is initial, i.e. nothing has been entered/added yet */
  readonly initial = signal(true);

  /** Local state of the to-be-added note */
  readonly note = signal<Note | null>(null);

  readonly noteColor = computed(
    () => this.note()?.backgroundColor || 'inherit'
  );

  /** Whether deletion via delete action button requires user confirmation. */
  readonly deletionRequiresConfirmation = computed(() => {
    const note = this.note();
    return Boolean(note?.title || note?.content);
  });

  /**
   * Listen to clicks on root component in order to close the add note component.
   */
  private outsideClick$ = fromEvent(
    this.appRef.components[0].location.nativeElement,
    'mousedown'
  ).pipe(tap(() => this.open.set(false)));

  /**
   * Subscribe for changes in open state.
   * When switching to opened, add listener for outside click and preselect
   * label if navigation currently is on some label.
   * When switching to closed, clear added note if necessary.
   * Skip initial emission of `false`.
   */
  _ = this.open$.pipe(skip(1), takeUntilDestroyed()).subscribe((open) => {
    if (open) {
      this.outsideClickSubscription = this.outsideClick$.subscribe();

      // Preselect add label
      const label = this.labelsService
        .labels()
        .find(
          (label) =>
            label.name ===
            this.navigationService.notesParamsSnapshot().labelName
        );

      label && this.handleNoteInputChange({ labels: [label] });
    } else {
      this.outsideClickSubscription?.unsubscribe();

      // Add note to state if is not empty
      const note = this.note();
      if (note) {
        if (note.content || note.title) {
          this.notesService.addNoteToState(note);
        } else {
          this.notesService.deleteNote(note.id);
        }
      }

      this.resetComponent();
    }
  });

  /**
   * Handle changes in input. Add new note on first change and edit for subsequent changes.
   * Changes are only send to "backend", the states in notes- and labelsService will
   * be updated when the component is blurred/closed.
   *
   * A local state tracks the state of the to-be-added note.   *
   */
  handleNoteInputChange(noteInput: NoteInput) {
    if (this.initial()) {
      const addedNote = this.notesService.addNote(noteInput, false);
      this.initial.set(false);
      this.note.set(addedNote);
    } else {
      const noteUpdate = this.notesService.editNote(this.note()!.id, noteInput);
      this.note.update((prevNote) => ({ ...prevNote!, ...noteUpdate }));
    }
  }

  /**
   * Resets `noteState` and resets note form without emitting changes.
   */
  resetComponent() {
    this.note.set(null);
    this.initial.set(true);

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
}
