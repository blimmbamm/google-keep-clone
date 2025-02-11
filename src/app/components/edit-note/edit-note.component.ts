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

@Component({
  selector: 'app-edit-note',
  imports: [
    MatButtonModule,
    ReactiveFormsModule,
    ContenteditableValueAccessorModule,
    MatIconModule,
    NoteFormComponent,
    NoteActionsComponent,
  ],
  templateUrl: './edit-note.component.html',
  styleUrl: './edit-note.component.scss',
})
export class EditNoteComponent {
  readonly data: { note: Note } = inject(MAT_DIALOG_DATA);

  readonly queryService = inject(QueryService);
  readonly navigationService = inject(NavigationService);
  readonly dialogRef = inject(MatDialogRef);

  handleEditNote(noteInput: NoteInput) {
    this.editNoteMutation.mutate(noteInput);
  }

  editNoteMutation = this.queryService.useMutation({
    httpObsFn: (noteInput: NoteInput) => editNote(this.data.note.id, noteInput),
    onError: () => {},
    onSuccess: () => {
      const { label, trash } = this.navigationService.notesParamsSnapshot();
      this.queryService.invalidateQuery(['notes', label, trash]);
    },
  });

  handleDoneEditing() {
    this.dialogRef.close();
  }
}
