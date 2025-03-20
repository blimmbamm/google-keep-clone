import { Directive, ElementRef, inject, input, output } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';

import { Note } from '../../../../data/notes';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '../../confirm-dialog/confirm-dialog.component';
import { NotesService } from '../../../services/notes/notes.service';

@Directive({
  selector: '[appDeleteNoteAction]',
  host: {
    '(click)': 'handleDeleteNote($event)',
  },
})
export class DeleteNoteActionDirective {
  private elementRef = inject<ElementRef<HTMLButtonElement>>(ElementRef);
  private dialog = inject(MatDialog);
  private notesService = inject(NotesService);

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
  // readonly requireConfirmation$ = input<Observable<boolean>>(of(true));

  readonly requireConfirmation = input(true);

  deleteNote() {
    this.note() &&
      (this.moveToTrash()
        ? this.notesService.editNote(this.note()!.id, { trash: true })
        : this.notesService.deleteNote(this.note()!.id));

    // Callback for some parent component stuff:
    this.onDeleteNote.emit();
  }

  /**
   * Handler for deleting note. Deletion starts once information is available
   * on whether user confirmation is required.
   *
   * If confirmation is required, open confirmation dialog, otherwise delete
   * note right away.
   */
  handleDeleteNote(event: MouseEvent) {
    this.elementRef.nativeElement.blur();
    event.stopPropagation();

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
          confirmed && this.deleteNote();
        });
    } else {
      this.deleteNote();
    }
  }
}
