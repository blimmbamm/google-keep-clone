import {
  AfterContentInit,
  Component,
  ElementRef,
  inject,
  input,
} from '@angular/core';
import {
  deleteLabel,
  editLabel,
  Label,
  LabelInput,
} from '../../../../data/label';
import { LabelInputComponent } from '../label-input/label-input.component';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { fromEvent, map, merge, Observable } from 'rxjs';
import { AsyncPipe } from '@angular/common';
import { QueryService } from '../../../services/query.service';
import { MatDialog } from '@angular/material/dialog';
import { MutateLabelDirective } from '../mutate-label.directive';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '../../confirm-dialog/confirm-dialog.component';

/**
 * Component to edit a label. This component shares some functionality
 * with the component to add a new label, so the shared functionality is
 * extracted into an abstract directive, that both components inherit from.
 */
@Component({
  selector: 'app-edit-label',
  imports: [LabelInputComponent, MatButtonModule, MatIconModule, AsyncPipe],
  templateUrl: './edit-label.component.html',
  styleUrl: './edit-label.component.scss',
})
export class EditLabelComponent
  extends MutateLabelDirective<Label>
  implements AfterContentInit
{
  private queryService = inject(QueryService);
  private hostElement = inject(ElementRef);
  private dialog = inject(MatDialog);

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
    this.inputElement().nativeElement.value = this.label().name;
  });

  /**
   * Mutation to edit the label. The error stream is used in the template
   * to notify if new name is not allowed (either one with same name already
   * exists or name is empty). In addition, input value gets reset to the label's
   * old value.
   */
  readonly editLabelMutation = this.queryService.useMutation({
    httpObsFn: (args: { id: number; labelInput: LabelInput }) =>
      editLabel(args.id, args.labelInput),
    onError: () => {
      this.inputElement().nativeElement.value = this.label().name;
    },
    onSuccess: () => {
      this.queryService.invalidateQuery(['labels']);
    },
  });

  /**
   * Mutation to delete a label. The deletion has to be confirmed in an
   * extra dialog.
   */
  readonly deleteLabelMutation = this.queryService.useMutation({
    httpObsFn: (id: number) => deleteLabel(id),
    onError: () => {},
    onSuccess: () => {
      this.queryService.invalidateQuery(['labels']);
    },
  });

  /** This triggers the label editing mutation. */
  handleEditLabel(labelName: string) {
    this.editLabelMutation.mutate({
      id: this.label().id,
      labelInput: { name: labelName },
    });
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
          this.deleteLabelMutation.mutate(this.label().id);
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
