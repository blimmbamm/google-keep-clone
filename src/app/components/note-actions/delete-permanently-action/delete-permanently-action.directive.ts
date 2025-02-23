import { Directive, inject, input } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';

import { QueryService } from '../../../services/query.service';
import { deleteNote, Note } from '../../../../data/notes';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '../../confirm-dialog/confirm-dialog.component';

@Directive({
  selector: '[appDeletePermanentlyAction]',
  host: {
    '(click)': 'handlePermanentDeletion($event)',
  },
})
export class DeletePermanentlyActionDirective {
  private queryService = inject(QueryService);
  private dialog = inject(MatDialog);

  readonly note = input.required<Note>();

  readonly deleteNoteMutation = this.queryService.useMutation({
    httpObsFn: (id: number) => deleteNote(id),
    onError: () => {},
    onSuccess: () => this.queryService.refetchCurrentNotes(),
  });

  handlePermanentDeletion(event: MouseEvent) {
    event.stopPropagation();

    this.dialog
      .open<ConfirmDialogComponent, ConfirmDialogData, boolean>(
        ConfirmDialogComponent,
        {
          data: {
            dialogMessage: 'Delete this note permanently?',
          },
          panelClass: 'dialog-panel',
          autoFocus: false,
        }
      )
      .afterClosed()
      .subscribe((confirmed) => {
        if (confirmed) {
          this.deleteNoteMutation.mutate(this.note().id);
        }
      });
  }
}
