import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { DatePipe } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ContenteditableValueAccessorModule } from '@tinkoff/angular-contenteditable-accessor';

import { NavigationService } from '../../services/navigation.service';
import { NoteFormComponent } from '../note-form/note-form.component';
import { NoteActionsComponent } from '../note-actions/note-actions/note-actions.component';
import { NoteManageLabelsActionComponent } from '../note-actions/note-manage-labels-action/note-manage-labels-action.component';
import { LabelsStackComponent } from '../labels/labels-stack/labels-stack.component';
import { ChangeBackgroundColorActionComponent } from '../note-actions/change-background-color-action/change-background-color-action.component';
import { CreateCopyActionDirective } from '../note-actions/create-copy-action/create-copy-action.directive';
import { DeleteNoteActionDirective } from '../note-actions/delete-note-action/delete-note-action.directive';
import { NoteInput } from '../../../data/notes';
import { NotesService } from '../../services/notes/notes.service';

export interface EditNoteDialogData {
  // note: Note;
  noteId: number;
}

@Component({
  selector: 'app-edit-note',
  imports: [
    MatButtonModule,
    ReactiveFormsModule,
    ContenteditableValueAccessorModule,
    MatIconModule,
    NoteFormComponent,
    NoteActionsComponent,
    NoteManageLabelsActionComponent,
    LabelsStackComponent,
    DeleteNoteActionDirective,
    ChangeBackgroundColorActionComponent,
    DatePipe,
    CreateCopyActionDirective,
    MatTooltipModule,
  ],
  templateUrl: './edit-note.component.html',
  styleUrl: './edit-note.component.scss',
  host: {
    '[style.background-color]': 'note().backgroundColor',
  },
})
export class EditNoteComponent {
  public data = inject<EditNoteDialogData>(MAT_DIALOG_DATA);

  readonly navigationService = inject(NavigationService);
  readonly dialogRef = inject(MatDialogRef);
  private notesService = inject(NotesService);

  readonly note = this.notesService.editingNote;

  handleEditNote(noteInput: NoteInput) {
    this.notesService.editNote(this.data.noteId, noteInput);
  }

  handleDoneEditing() {
    this.dialogRef.close();
  }

  constructor() {
    this.notesService.editingNoteId.set(this.data.noteId);
  }
}
