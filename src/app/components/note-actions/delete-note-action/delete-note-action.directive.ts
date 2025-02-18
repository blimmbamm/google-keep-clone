import { Directive, inject, input, output } from '@angular/core';
import { QueryService } from '../../../services/query.service';
import { NavigationService } from '../../../services/navigation.service';
import { MatDialog } from '@angular/material/dialog';
import { deleteNote, moveNoteToTrash, Note } from '../../../../data/notes';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '../../confirm-dialog/confirm-dialog.component';

@Directive({
  selector: '[appDeleteNoteAction]',
  host: {
    '(click)': 'handleDeleteNote($event)',
  },
})
export class DeleteNoteActionDirective {
  private queryService = inject(QueryService);
  readonly navigationService = inject(NavigationService);
  private dialog = inject(MatDialog);

  readonly requireConfirmation = input<boolean>(true);
  readonly deleteDialogMessage = input.required<string>();
  readonly tooltip = input<string>();
  readonly onDeleteNote = output<number | void>();
  readonly note = input.required<Note | null>();
  readonly moveToTrash = input(true);

  readonly deleteNoteMutation = this.queryService.useMutation({
    httpObsFn: (id: number) =>
      this.moveToTrash() ? moveNoteToTrash(id) : deleteNote(id),
    onError: () => {},
    onSuccess: (_, id) => {
      const { labelName, trash } = this.navigationService.notesParamsSnapshot();
      this.queryService.invalidateQuery(['notes', labelName, trash]);
      this.onDeleteNote.emit(id);
    },
  });

  handleDeleteNote(event: MouseEvent) {
    event.stopPropagation();

    /**
     * If confirmation is required to delete the note, open confirm dialog
     * and trigger mutation if dialog sends back `true` when closing.
     */
    if (this.requireConfirmation()) {
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
      const note = this.note();
      if (note) {
        // only trigger delete mutation if note is truthy
        this.deleteNoteMutation.mutate(note.id);
      } else {
        // If no mutation had to be triggered, emit onDeleteNote event right away:
        this.onDeleteNote.emit();
      }
    }
  }
}
