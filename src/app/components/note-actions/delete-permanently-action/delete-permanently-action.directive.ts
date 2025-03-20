import { Directive, inject, input } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';

import { Note } from '../../../../data/notes';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '../../confirm-dialog/confirm-dialog.component';
import { NotesService } from '../../../services/notes/notes.service';

@Directive({
  selector: '[appDeletePermanentlyAction]',
  host: {
    '(click)': 'handlePermanentDeletion($event)',
  },
})
export class DeletePermanentlyActionDirective {
  private dialog = inject(MatDialog);
  private notesService = inject(NotesService);

  readonly note = input.required<Note>();

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
        confirmed && this.notesService.deleteNote(this.note().id);
      });
  }
}
