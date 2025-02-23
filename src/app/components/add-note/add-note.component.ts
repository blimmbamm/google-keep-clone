import {
  ApplicationRef,
  Component,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import {
  BehaviorSubject,
  debounceTime,
  filter,
  fromEvent,
  map,
  of,
  skip,
  Subscription,
  switchMap,
  takeWhile,
  tap,
} from 'rxjs';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

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
import { NoteActionsComponent } from '../note-actions/note-actions/note-actions.component';
import { LabelsStackComponent } from '../labels/labels-stack/labels-stack.component';
import { NoteManageLabelsActionComponent } from '../note-actions/note-manage-labels-action/note-manage-labels-action.component';
import { ChangeBackgroundColorActionComponent } from '../note-actions/change-background-color-action/change-background-color-action.component';
import { DeleteNoteActionDirective } from '../note-actions/delete-note-action/delete-note-action.directive';
import { getLabelByName } from '../../../data/label';

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
  readonly queryService = inject(QueryService);
  readonly navigationService = inject(NavigationService);

  private noteFormComponent = viewChild.required(NoteFormComponent);

  /**
   * Outside click stream gets subscribed when component is opened and unsubscribed
   * when closed.
   */
  private outsideClickSubscription?: Subscription;

  /**
   * Subscription to async information on currently visiting label; has to
   * be unsubscribed when closing the add-note component.
   */
  private preselectLabelSubscription?: Subscription;

  /**
   * Subject that emits current idle status.
   *
   * This is needed because mutations (add/edit) are only triggered 300ms after
   * last key stroke. Any clean-up logic and deletion via delete action has to
   * wait until these 300ms are actual passed and the mutations have taken place.
   */
  readonly mutationsIdle$ = new BehaviorSubject(true);

  /**
   * Observable that emits `true` when mutations idle status is `true` or
   * asynchronously emits `true` as soon as status turns from `false` to `true`
   * and then automatically completes.
   */
  readonly mutationsTurnIdle$ = this.mutationsIdle$.pipe(
    takeWhile((idle) => !idle, true),
    filter((idle) => idle),
  );

  readonly typingInitial = signal(true);
  readonly mutationsIdleOnStartTyping = signal(true);

  /**
   * Query for the current label, based on fragment information. If there is a
   * label, this gets added to the new note automatically in the beginning.
   */
  readonly labelQuery = this.queryService.useParametrizedQuery({
    paramsObs: this.navigationService.notesParamsObs$.pipe(
      /**
       * Enter non-idle state when asynchronously checking label.
       */
      tap(() => this.mutationsIdle$.next(false)),
      map((params) => params.labelName)
    ),
    httpObsFn: (labelName) =>
      labelName ? getLabelByName(labelName) : of(null),
    queryKey: (labelName) => ['label', labelName],
  });

  /**
   * Whether the component is open/in extended mode, i.e. if it received a click
   */
  readonly open = signal(false);
  readonly open$ = toObservable(this.open);

  /** Initial note state */
  private INITIAL_NOTE_STATE = { note: null, initial: true, empty: true };

  /**
   * Tracking the state of the to be added note. If note gets added + optionally
   * edited thereafter, it will be stored in `note`. `initial` means that the note
   * hasn't been added yet. `empty` means that note has no title and no content set.
   * Empty notes will be discarded without further notification when 'blurring'
   * the add-note component.
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
   * Subscribe for changes in open state.
   *
   * When switching to opened, add listener for outside click.
   *
   * When switching to closed, clear added note if necessary.
   *
   * Skip initial emission of `false`.
   */
  _ = this.open$.pipe(skip(1), takeUntilDestroyed()).subscribe((open) => {
    if (open) {
      this.outsideClickSubscription = this.outsideClick$.subscribe();

      this.preselectLabelSubscription = this.labelQuery.data$.subscribe(
        (label) => {
          /**
           * If a label is emitted, trigger add mutation and enter
           * idle state in success callback of that mutation.
           *
           * If no specific label is currently visited,
           * enter idle state right away.
           *
           * Note: This requires `useParametrizedQuery` to not emit an
           * initial null value. However, in that case, `skip`
           * could be used to skip the first value.
           */
          if (label) {
            this.addNoteMutation.mutate({ labels: [label] });
          } else {
            this.mutationsIdle$.next(true);
          }
        }
      );
    } else {
      this.outsideClickSubscription?.unsubscribe();
      this.preselectLabelSubscription?.unsubscribe();

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
      this.typingInitial.set(true);
    },
  });

  readonly editNoteMutation = this.queryService.useMutation({
    httpObsFn: (inputs: { id: number; noteInput: NoteInput }) =>
      editNote(inputs.id, inputs.noteInput),
    onError: () => {},
    onSuccess: (note, { noteInput }) => {
      // Empty check has to be made on note because noteInput possibly
      // carries only labels or background color even though title or
      // content is actually there from previously adding
      this.noteState.update((state) => ({
        ...state,
        note,
        empty: !note?.title && !note?.content,
      }));

      this.mutationsIdle$.next(true);
      this.typingInitial.set(true);
    },
  });

  readonly deleteNoteMutation = this.queryService.useMutation({
    httpObsFn: (id: number) => deleteNote(id),
    onError: () => {},
    onSuccess: () => {},
  });

  /**
   * This only needed for changing labels or background color.
   */
  handleNoteInputChange(noteInput: NoteInput) {
    this.mutationsTurnIdle$.subscribe(() => {
      if (this.noteState().initial) {
        this.addNoteMutation.mutate(noteInput);
      } else {
        this.editNoteMutation.mutate({
          id: this.noteState().note!.id,
          noteInput,
        });
      }
    });
  }

  /**
   * Resets `noteState` and resets note form without emitting changes.
   */
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

  /**
   * Add listener for changes in note input form.
   * 
   * In general, changes in the inputs for title/content shouldn't lead to 
   * immediate mutations, instead the emission of new values is debounced, 
   * such that mutations are triggered only if 300ms (or something similar) 
   * passed without another key stroke. 
   * 
   * When starting to type, the mutation state is set to non-idle right away. 
   * With an extra state, the information whether mutations were idle on first 
   * key stroke, is carried to the point of time of actual emission of changes,
   * which is probably delayed due to debouncing.
   * 
   * Based on that information, mutations are triggered either immediately, or 
   * they wait until mutations turn to idle state. 
   */
  ngAfterViewInit() {
    this.noteFormComponent()
      .noteForm.valueChanges.pipe(
        tap(() => {
          if (this.typingInitial()) {
            // Execute this only on first keystroke (first keystroke for each ~ typing cycle)
            this.mutationsIdleOnStartTyping.set(this.mutationsIdle$.getValue());
            this.typingInitial.set(false); // gets reset when mutations succeed
          }

          // Set mutations to non-idle if not already the case
          this.mutationsIdle$.getValue() && this.mutationsIdle$.next(false);
        }),
        debounceTime(300),
        switchMap((noteInput) => {
          if (this.mutationsIdleOnStartTyping()) {
            // If mutations are non-idle because of this typing cycle, don't wait
            // for them to turn idle, just proceed
            return of(noteInput);
          } else {
            // If mutations are non-idle because of something else, wait for them to 
            // turn idle before proceeding
            return this.mutationsTurnIdle$.pipe(
              map(() => noteInput)
            );
          }
        })
      )
      .subscribe((noteInput) => {
        if (this.noteState().initial) {
          this.addNoteMutation.mutate(noteInput);
        } else {
          this.editNoteMutation.mutate({
            id: this.noteState().note!.id,
            noteInput,
          });
        }
      });
  }
}
