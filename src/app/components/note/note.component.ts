import { Component, computed, inject, input, signal } from '@angular/core';
import { editNote, Note, NoteInput } from '../../../data/notes';
import { MatIcon } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { NoteActionsComponent } from '../note-actions/note-actions.component';
import { LabelsStackComponent } from '../labels/labels-stack/labels-stack.component';
import { NoteManageLabelsActionComponent } from '../note-actions/note-manage-labels-action/note-manage-labels-action.component';
import { QueryService } from '../../services/query.service';
import { NavigationService } from '../../services/navigation.service';
import { ChangeBackgroundColorActionComponent } from '../note-actions/change-background-color-action/change-background-color-action.component';
import { CreateCopyActionDirective } from '../note-actions/create-copy-action/create-copy-action.directive';
import { MatDialog } from '@angular/material/dialog';
import {
  EditNoteComponent,
  EditNoteDialogData,
} from '../edit-note/edit-note.component';
import { DeleteNoteActionDirective } from '../note-actions/delete-note-action/delete-note-action.directive';
import { DeletePermanentlyActionDirective } from '../note-actions/delete-permanently-action/delete-permanently-action.directive';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '../confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-note',
  imports: [
    MatButtonModule,
    MatIcon,
    NoteActionsComponent,
    LabelsStackComponent,
    DeleteNoteActionDirective,
    NoteManageLabelsActionComponent,
    ChangeBackgroundColorActionComponent,
    CreateCopyActionDirective,
    DeletePermanentlyActionDirective,
  ],
  templateUrl: './note.component.html',
  styleUrl: './note.component.scss',
  host: {
    '[style.background-color]': 'note().backgroundColor',
    '(click)': 'handleHostClick()',
  },
})
export class NoteComponent {
  readonly queryService = inject(QueryService);
  readonly navigationService = inject(NavigationService);
  readonly dialog = inject(MatDialog);

  readonly note = input.required<Note>();

  readonly actionsVisible = signal(false);

  readonly labels = computed(() =>
    this.note().labels?.length ? this.note().labels : undefined
  );

  readonly emptyNote = computed(
    () => !this.note().title && !this.note().content
  );

  readonly editNoteMutation = this.queryService.useMutation({
    httpObsFn: (args: { id: number; noteInput: NoteInput }) =>
      editNote(args.id, args.noteInput),
    onError: () => {},
    onSuccess: () => {
      this.queryService.refetchCurrentNotes();
    },
  });

  restoreFromTrash() {
    this.editNoteMutation.mutate({
      id: this.note().id,
      noteInput: { trash: false },
    });
  }

  openEditNoteDialog() {
    this.dialog.open<EditNoteComponent, EditNoteDialogData>(EditNoteComponent, {
      data: { note: this.note() },
      panelClass: 'edit-note-dialog-panel',
      autoFocus: false,
      width: '100%',
      maxWidth: '600px',
    });
  }

  openRestoreDialog() {
    this.dialog
      .open<ConfirmDialogComponent, ConfirmDialogData, boolean>(
        ConfirmDialogComponent,
        {
          data: { dialogMessage: 'Cannot edit trashed note. Restore it?' },
          panelClass: 'dialog-panel',
          autoFocus: false,
        }
      )
      .afterClosed()
      .subscribe((confirmed) => {
        confirmed && this.restoreFromTrash();
      });
  }

  handleHostClick() {
    this.note().trash ? this.openRestoreDialog() : this.openEditNoteDialog();
  }

  handleEditNote(noteInput: NoteInput) {
    this.editNoteMutation.mutate({ id: this.note().id, noteInput });
  }

  toggleActionsVisibility() {
    this.actionsVisible.update((visible) => !visible);
  }

  handleRestoreFromTrash(event: MouseEvent) {
    event.stopPropagation();

    this.restoreFromTrash();
  }
}
