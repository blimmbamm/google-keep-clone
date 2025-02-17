import {
  Component,
  inject,
  input,
  TemplateRef,
  viewChild,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { QueryService } from '../../../services/query.service';
import { NavigationService } from '../../../services/navigation.service';
import { deleteNote, Note } from '../../../../data/notes';

@Component({
  selector: 'app-delete-permanently-action',
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './delete-permanently-action.component.html',
  styleUrl: './delete-permanently-action.component.scss',
})
export class DeletePermanentlyActionComponent {
  private queryService = inject(QueryService);
  readonly navigationService = inject(NavigationService);
  private dialog = inject(MatDialog);

  readonly note = input.required<Note>();

  /** Ref to delete dialog. */
  public dialogRef?: MatDialogRef<any>;

  private dialogTemplate = viewChild.required('dialog', {
    read: TemplateRef,
  });

  readonly deleteNoteMutation = this.queryService.useMutation({
    httpObsFn: (id: number) => deleteNote(id),
    onError: () => {},
    onSuccess: (_, id) => {
      const { labelName, trash } = this.navigationService.notesParamsSnapshot();
      this.queryService.invalidateQuery(['notes', labelName, trash]);
    },
  });

  handleStartPermanentDeletion(event: MouseEvent) {
    event.stopPropagation();

    // If dialog is outsourced into extra component, this reference can probably be injected
    this.dialogRef = this.dialog.open(this.dialogTemplate(), {
      panelClass: 'dialog-panel',
      autoFocus: false,
    });
  }

  handleConfirmation() {
    this.deleteNoteMutation.mutate(this.note().id);
    this.dialogRef?.close();
  }
}
