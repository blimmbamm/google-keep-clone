import {
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  model,
  OnInit,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { SelectionModel } from '@angular/cdk/collections';
import { FormsModule } from '@angular/forms';
import { MatRipple } from '@angular/material/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';

import { Note, NoteInput } from '../../../../data/notes';
import { Label } from '../../../../data/label';
import { LabelsService } from '../../../services/labels/labels.service';

@Component({
  selector: 'app-note-manage-labels-action',
  imports: [
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    FormsModule,
    MatRipple,
    MatTooltipModule,
  ],
  templateUrl: './note-manage-labels-action.component.html',
  styleUrl: './note-manage-labels-action.component.scss',
})
export class NoteManageLabelsActionComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  private labelsService = inject(LabelsService);

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
  readonly labelsFilter = signal('');

  readonly visibleLabels = computed(() =>
    this.labelsService
      .labels()
      .filter((label) =>
        label.name.toLowerCase().includes(this.labelsFilter().toLowerCase())
      )
  );

  toggleSelection(label: Label) {
    this.labelsSelection?.toggle(label);
  }

  /** Prevent menu from being closed by clicking anywhere in the menu. */
  doNotPropagate(event: MouseEvent) {
    event.stopPropagation();
  }

  handleOpenMenu(event: MouseEvent) {
    event.stopPropagation();
    this.menuOpen.set(true);
  }

  handleClose() {
    this.menuOpen.set(false);
    this.labelsFilter.set('');
  }

  handleAddLabel() {
    const addedLabel = this.labelsService.addLabel({
      name: this.labelsFilter(),
    });

    // Select the newly added label for this note:
    this.labelsSelection?.select(addedLabel);
    this.labelsFilter.set('');
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
    this.labelsSelection.changed
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.onNoteLabelsInputChange.emit({
          labels: this.labelsSelection?.selected,
        });
      });
  }
}
