import { Directive, inject, input, output } from '@angular/core';
import { QueryService } from '../../../services/query.service';
import { MatDialog } from '@angular/material/dialog';
import { deleteNote, moveNoteToTrash, Note } from '../../../../data/notes';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '../../confirm-dialog/confirm-dialog.component';
import { Observable, of, take } from 'rxjs';

@Directive({
  selector: '[appDeleteNoteAction]',
  host: {
    '(click)': 'handleDeleteNote($event)',
  },
})
export class DeleteNoteActionDirective {
  private queryService = inject(QueryService);
  private dialog = inject(MatDialog);

  readonly deleteDialogMessage = input.required<string>();
  readonly tooltip = input<string>();

  /** this will emit once deletion is finished */
  readonly onDeleteNote = output<number | void>();
  readonly note = input.required<Note | null>();
  readonly moveToTrash = input(true);

  /**
   * As default, this emits true right away. For add-note this is conditional
   * and asynchronous information, hence provided as stream.
   */
  readonly requireConfirmation$ = input<Observable<boolean>>(of(true));

  /** Whether notes should be refreshed. Default `true`, `false` for add-note. */
  readonly refetchOnDelete = input(true);

  readonly deleteNoteMutation = this.queryService.useMutation({
    httpObsFn: (id: number) =>
      this.moveToTrash() ? moveNoteToTrash(id) : deleteNote(id),
    onError: () => {},
    onSuccess: (_, id) => {
      this.refetchOnDelete() && this.queryService.refetchCurrentNotes();
      this.onDeleteNote.emit(id);
    },
  });

  /**
   * Handler for deleting note. Deletion starts once information is available
   * on whether user confirmation is required.
   *
   * If confirmation is required, open confirmation dialog, otherwise delete
   * note right away.
   */
  handleDeleteNote(event: MouseEvent) {
    event.stopPropagation();

    this.requireConfirmation$()
      .pipe(take(1))
      .subscribe((requireConfirmation) => {
        if (requireConfirmation) {
          this.dialog
            .open<ConfirmDialogComponent, ConfirmDialogData, boolean>(
              ConfirmDialogComponent,
              {
                data: { dialogMessage: this.deleteDialogMessage() },
                panelClass: 'dialog-panel',
                autoFocus: false,
              }
            )
            .afterClosed()
            .subscribe((confirmed) => {
              if (confirmed) {
                this.deleteNoteMutation.mutate(this.note()!.id);
              }
            });
        } else {
          this.onDeleteNote.emit();
        }
      });
  }
}
