import {
  AfterContentInit,
  Component,
  ElementRef,
  inject,
  input,
} from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { fromEvent, map, merge, Observable } from 'rxjs';
import { AsyncPipe } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';

import { LabelInputComponent } from '../label-input/label-input.component';
import { MutateLabelDirective } from '../mutate-label/mutate-label.directive';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '../../confirm-dialog/confirm-dialog.component';
import { NavigationService } from '../../../services/navigation.service';
import { Label } from '../../../../data/label';
import { LabelsService } from '../../../services/labels/labels.service';

/**
 * Component to edit a label. This component shares some functionality
 * with the component to add a new label, so the shared functionality is
 * extracted into an abstract directive, that both components inherit from.
 */
@Component({
  selector: 'app-edit-label',
  imports: [
    LabelInputComponent,
    MatButtonModule,
    MatIconModule,
    AsyncPipe,
    ReactiveFormsModule,
  ],
  templateUrl: './edit-label.component.html',
  styleUrl: './edit-label.component.scss',
})
export class EditLabelComponent
  extends MutateLabelDirective<Label>
  implements AfterContentInit
{
  private navigationService = inject(NavigationService);
  private hostElement = inject(ElementRef);
  private dialog = inject(MatDialog);
  private labelsService = inject(LabelsService);

  /**
   * Emits boolean hover status on host element.
   * Observable is set in ngAfterContentInit, below.
   *
   * Based on hover state, either trash or label icon is rendered.
   */
  public isHovered$?: Observable<boolean>;

  /** The label corresponding to the input. */
  override label = input.required<Label>();

  /**
   * When edit label input component gets deactivated, reset input.
   * It gets deactivated by activating another label input component.
   */
  _ = this.deactivate$.subscribe(() => {
    this.labelNameInput.setValue(this.label().name);
  });

  /** This triggers the label editing mutation. */
  handleEditLabel(labelName: string) {
    try {
      this.labelsService.editLabel(this.label().id, { name: labelName });
    } catch (error) {
      this.error.set(error as Error);
    }
  }

  /** This opens a dialog to confirm the deletion of the label. */
  handleDeleteLabel() {
    this.dialog
      .open<ConfirmDialogComponent, ConfirmDialogData, boolean>(
        ConfirmDialogComponent,
        {
          data: {
            dialogMessage: "Delete this label? Your notes won't be deleted.",
          },
          panelClass: 'dialog-panel',
          autoFocus: false,
        }
      )
      .afterClosed()
      .subscribe((confirmed) => {
        if (confirmed) {
          this.labelsService.deleteLabel(this.label().id);

          const { labelName } = this.navigationService.notesParamsSnapshot();
          if (this.label().name === labelName) {
            this.navigationService.navigate({ labelName: null, trash: false });
          }
        }
      });
  }

  /**
   * Add the host element hover status stream to the
   * `ngAfterContentInit` lifecycle method
   */
  override ngAfterContentInit(): void {
    super.ngAfterContentInit();

    this.isHovered$ = merge(
      fromEvent(this.hostElement.nativeElement, 'mouseenter').pipe(
        map(() => true)
      ),
      fromEvent(this.hostElement.nativeElement, 'mouseleave').pipe(
        map(() => false)
      )
    );
  }
}
