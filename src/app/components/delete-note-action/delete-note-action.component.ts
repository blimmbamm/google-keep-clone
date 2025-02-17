import {
  Component,
  inject,
  input,
  output,
  TemplateRef,
  viewChild,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { QueryService } from '../../services/query.service';
import { deleteNote, moveNoteToTrash, Note } from '../../../data/notes';
import { NavigationService } from '../../services/navigation.service';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-delete-note-action',
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './delete-note-action.component.html',
  styleUrl: './delete-note-action.component.scss',
})
export class DeleteNoteActionComponent {
  private queryService = inject(QueryService);
  readonly navigationService = inject(NavigationService);
  private dialog = inject(MatDialog);

  readonly requireConfirmation = input<boolean>(true);
  readonly deleteDialogMessage = input<string>();
  readonly tooltip = input<string>();
  readonly onDeleteNote = output<number | void>();
  readonly note = input.required<Note | null>();
  readonly moveToTrash = input(true);

  /** Ref to delete dialog. */
  public deleteDialogRef?: MatDialogRef<any>;

  private deleteDialogTemplate = viewChild.required('deleteDialog', {
    read: TemplateRef,
  });

  readonly deleteNoteMutation = this.queryService.useMutation({
    httpObsFn: (id: number) => this.moveToTrash() ? moveNoteToTrash(id) : deleteNote(id),
    onError: () => {},
    onSuccess: (_, id) => {
      const { labelName, trash } = this.navigationService.notesParamsSnapshot();
      this.queryService.invalidateQuery(['notes', labelName, trash]);
      this.onDeleteNote.emit(id);
    },
  });
  
  // readonly moveNoteToTrashMutation = this.queryService.useMutation({
  //   httpObsFn: (id: number) => moveNoteToTrash(id),
  //   onError: () => {},
  //   onSuccess: (_, id) => {
  //     const { labelName, trash } = this.navigationService.notesParamsSnapshot();
  //     this.queryService.invalidateQuery(['notes', labelName, trash]);
  //     this.onDeleteNote.emit(id);
  //   },
  // });

  handleDeleteNote(event: MouseEvent) {
    event.stopPropagation();

    /**
     * Confirm deletion dialog should open first, same as for deleting labels
     * For add-note, this should be conditional: If note is initial/hasn't been
     * saved yet, no deletion should be triggered.
     *
     * If note is not empty, confirmation should be asked for
     * if note is empty and has been saved, deletion should go without confirmation
     * for add-note, Delete should have as callback that add-note closes;
     * on close there is however another deletion mechanism
     */
    if (this.requireConfirmation()) {
      this.deleteDialogRef = this.dialog.open(this.deleteDialogTemplate(), {
        panelClass: 'dialog-panel',
        autoFocus: false,
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

  handleConfirmDeletion() {
    // If confirmation is needed, note is defined. Little ugly however...
    this.deleteNoteMutation.mutate(this.note()!.id);
    this.deleteDialogRef?.close();
  }
}
