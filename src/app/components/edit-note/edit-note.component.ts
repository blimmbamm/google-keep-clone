import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { editNote, Note, NoteInput } from '../../../data/notes';
import { MatButtonModule } from '@angular/material/button';
import { ReactiveFormsModule } from '@angular/forms';
import { ContenteditableValueAccessorModule } from '@tinkoff/angular-contenteditable-accessor';
import { QueryService } from '../../services/query.service';
import { NavigationService } from '../../services/navigation.service';
import { MatIconModule } from '@angular/material/icon';
import { NoteFormComponent } from '../note-form/note-form.component';
import { NoteActionsComponent } from '../note-actions/note-actions.component';
import { NoteManageLabelsActionComponent } from '../note/note-manage-labels-action/note-manage-labels-action.component';
import { LabelsStackComponent } from '../labels/labels-stack/labels-stack.component';
import { DeleteNoteActionComponent } from "../delete-note-action/delete-note-action.component";

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
    DeleteNoteActionComponent
],
  templateUrl: './edit-note.component.html',
  styleUrl: './edit-note.component.scss',
})
export class EditNoteComponent {
  public data: { note: Note } = inject(MAT_DIALOG_DATA);

  readonly queryService = inject(QueryService);
  readonly navigationService = inject(NavigationService);
  readonly dialogRef = inject(MatDialogRef);

  handleEditNote(noteInput: NoteInput) {
    this.editNoteMutation.mutate(noteInput);
  }

  editNoteMutation = this.queryService.useMutation({
    httpObsFn: (noteInput: NoteInput) => editNote(this.data.note.id, noteInput),
    onError: () => {},
    onSuccess: (_, noteInput) => {
      const { label, trash } = this.navigationService.notesParamsSnapshot();
      this.queryService.invalidateQuery(['notes', label, trash]);

      /**
       * Update the dialog data that was injected into the dialog.
       * 
       * The Problem is that data in dialog isn't refreshed/kept up to date,
       * even if data comes from stateful properties in parent component.
       */
      this.data = {
        note: {
          ...this.data.note,
          ...noteInput,
        },
      };
    },
  });

  handleDoneEditing() {
    this.dialogRef.close();
  }
}
