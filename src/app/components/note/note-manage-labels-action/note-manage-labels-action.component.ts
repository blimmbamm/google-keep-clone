import {
  Component,
  DestroyRef,
  inject,
  input,
  model,
  OnInit,
  output,
  viewChild,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { Note, NoteInput } from '../../../../data/notes';
import { QueryService } from '../../../services/query.service';
import { map, of, shareReplay, startWith, switchMap } from 'rxjs';
import { addLabel, getLabels, Label, LabelInput } from '../../../../data/label';
import { AsyncPipe } from '@angular/common';
import { SelectionModel } from '@angular/cdk/collections';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatRipple } from '@angular/material/core';

@Component({
  selector: 'app-note-manage-labels-action',
  imports: [
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    AsyncPipe,
    ReactiveFormsModule,
    MatRipple,
  ],
  templateUrl: './note-manage-labels-action.component.html',
  styleUrl: './note-manage-labels-action.component.scss',
})
export class NoteManageLabelsActionComponent implements OnInit {
  private queryService = inject(QueryService);
  private destroyRef = inject(DestroyRef);
  readonly menuTrigger = viewChild.required(MatMenuTrigger);

  /**
   * Output that emits changes in selection to parent component.
   */
  readonly onNoteLabelsInputChange = output<NoteInput>();

  readonly menuOpen = model<boolean>();

  /** The underlying note that is being worked on. */
  readonly note = input.required<Note | null>();

  /** The selection of labels for the note. */
  public labelsSelection?: SelectionModel<Label>;

  /** String filter value for the list of available labels. */
  readonly labelsFilter = new FormControl('', { nonNullable: true });

  /** Labels query that gets all labels */
  readonly labelsQuery = this.queryService.useParametrizedQuery({
    paramsObs: of(null),
    httpObsFn: () => getLabels(),
    queryKey: () => ['labels'],
  });

  /**
   * Since list of labels must be updated when the filter value changes,
   * labels would be queried on every keystroke. To avoid this, here is a
   * replayed variant of the labels$ data stream.
   *
   * Maybe this behavior could even be configurable by the query construction
   * method in queryService...
   */
  readonly labels$ = this.labelsQuery.data$.pipe(shareReplay());

  /**
   * Data stream that emits the filtered labels according to filter value.
   *
   * Initial `startWith('')` is needed because `valueChanges` only emits
   * on changes and thus no initial labels would be emitted otherwise.
   */
  readonly visibleLabels$ = this.labelsFilter.valueChanges.pipe(
    startWith(''),
    switchMap((labelsFilterValue) =>
      this.labels$.pipe(
        map((labels) =>
          labels?.filter((label) =>
            label.name.toLowerCase().includes(labelsFilterValue.toLowerCase())
          )
        )
      )
    )
  );

  /**
   * Mutation to add a new label on the fly.
   *
   * Errors can't happen here (at the moment), because the button to add a label
   * is only displayed in case no existing label matches the search string,
   * what also ensures that no label with empty name can be submitted.
   */
  readonly addLabelMutation = this.queryService.useMutation({
    httpObsFn: (labelInput: LabelInput) => addLabel(labelInput),
    onError: () => {},
    onSuccess: (addedLabel) => {
      this.labelsFilter.reset();
      // Exclamation wouldn't be needed if useMutation would work properly
      this.labelsSelection?.select(addedLabel!);
      this.queryService.invalidateQuery(['labels']);
    },
  });

  toggleSelection(label: Label) {
    this.labelsSelection?.toggle(label);
  }

  /** Prevent menu from being closed by clicking anywhere in the menu. */
  doNotPropagate(event: MouseEvent) {
    event.stopPropagation();
  }

  handleOpenMenu(event: MouseEvent){
    event.stopPropagation();
    this.menuOpen.set(true);
  }

  handleClose() {
    this.menuOpen.set(false);
    this.labelsFilter.reset();
  }

  handleAddLabel() {
    this.addLabelMutation.mutate({ name: this.labelsFilter.value });
  }

  /**
   * When menu is re-opened, the list of selected labels should reflect the
   * current state that could have been adjusted by removing labels via the
   * labels stack.
   */
  resetSelection() {
    this.labelsSelection?.setSelection(...(this.note()?.labels || []));
  }

  /**
   * Initialize labelsSelection here because it depends on a data input.
   *
   * Subsequently, subscribe to changes in selection and emit the current
   * selection to the output.
   */
  ngOnInit(): void {
    this.labelsSelection = new SelectionModel<Label>(
      true,
      this.note()?.labels,
      true,
      (label, otherLabel) => label.id === otherLabel.id
    );

    // This can probably be simplified by use of outputFromObservable
    const selectionChangeSubscription = this.labelsSelection.changed.subscribe(
      () => {
        this.onNoteLabelsInputChange.emit({
          labels: this.labelsSelection?.selected,
        });
      }
    );

    this.destroyRef.onDestroy(() => selectionChangeSubscription.unsubscribe());
  }
}
