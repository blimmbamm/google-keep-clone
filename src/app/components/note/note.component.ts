import { Component, computed, inject, input, signal } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { MatTooltipModule } from '@angular/material/tooltip';

import { Note, NoteInput } from '../../../data/notes';
import { NoteActionsComponent } from '../note-actions/note-actions/note-actions.component';
import { LabelsStackComponent } from '../labels/labels-stack/labels-stack.component';
import { NoteManageLabelsActionComponent } from '../note-actions/note-manage-labels-action/note-manage-labels-action.component';
import { NavigationService } from '../../services/navigation.service';
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
import { ChangeBackgroundColorActionComponent } from '../note-actions/change-background-color-action/change-background-color-action.component';
import { CreateCopyActionDirective } from '../note-actions/create-copy-action/create-copy-action.directive';
import { NotesService } from '../../services/notes/notes.service';

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
    MatTooltipModule,
  ],
  templateUrl: './note.component.html',
  styleUrl: './note.component.scss',
  host: {
    '[style.background-color]': 'note().backgroundColor',
    '(click)': 'handleHostClick()',
  },
})
export class NoteComponent {
  readonly navigationService = inject(NavigationService);
  readonly dialog = inject(MatDialog);
  readonly notesService = inject(NotesService);

  readonly note = input.required<Note>();

  readonly actionsVisible = signal(false);

  readonly labels = computed(() =>
    this.note().labels?.length ? this.note().labels : undefined
  );

  readonly emptyNote = computed(
    () => !this.note().title && !this.note().content
  );

  readonly mobile$ = inject(BreakpointObserver)
    .observe(Breakpoints.XSmall)
    .subscribe((state) => {
      this.actionsVisible.set(state.matches);
    });

  restoreFromTrash() {
    this.notesService.editNote(this.note().id, { trash: false });
  }

  openEditNoteDialog() {
    this.dialog.open<EditNoteComponent, EditNoteDialogData>(EditNoteComponent, {
      data: { noteId: this.note().id },
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
    this.notesService.editNote(this.note().id, noteInput);
  }

  toggleActionsVisibility() {
    this.actionsVisible.update((visible) => !visible);
  }

  handleRestoreFromTrash(event: MouseEvent) {
    event.stopPropagation();

    this.restoreFromTrash();
  }
}
