import { Component, computed, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { DatePipe } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ContenteditableValueAccessorModule } from '@tinkoff/angular-contenteditable-accessor';

import { QueryService } from '../../services/query.service';
import { NavigationService } from '../../services/navigation.service';
import { NoteFormComponent } from '../note-form/note-form.component';
import { NoteActionsComponent } from '../note-actions/note-actions.component';
import { NoteManageLabelsActionComponent } from '../note-actions/note-manage-labels-action/note-manage-labels-action.component';
import { LabelsStackComponent } from '../labels/labels-stack/labels-stack.component';
import { ChangeBackgroundColorActionComponent } from '../note-actions/change-background-color-action/change-background-color-action.component';
import { CreateCopyActionDirective } from '../note-actions/create-copy-action/create-copy-action.directive';
import { DeleteNoteActionDirective } from '../note-actions/delete-note-action/delete-note-action.directive';
import { editNote, Note, NoteInput } from '../../../data/notes';

export interface EditNoteDialogData {
  note: Note;
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
    '[style.background-color]': 'data.note.backgroundColor',
  },
})
export class EditNoteComponent {
  public data = inject<EditNoteDialogData>(MAT_DIALOG_DATA);

  readonly lastModifiedDate = computed(() => {});

  readonly queryService = inject(QueryService);
  readonly navigationService = inject(NavigationService);
  readonly dialogRef = inject(MatDialogRef);

  private editNoteMutation = this.queryService.useMutation({
    httpObsFn: (args: { id: number; noteInput: NoteInput }) =>
      editNote(args.id, args.noteInput),
    onError: () => {},
    onSuccess: (note, _) => {
      this.queryService.refetchCurrentNotes();

      /**
       * Update the dialog data that was injected into the dialog.
       *
       * The Problem is that data in dialog isn't refreshed/kept up to date,
       * even if data comes from stateful properties in parent component. Hence,
       * update it with the data returned by the mutation.
       */
      this.data = {
        note: {
          ...this.data.note,
          ...note,
        },
      };
    },
  });

  handleEditNote(noteInput: NoteInput) {
    this.editNoteMutation.mutate({ id: this.data.note.id, noteInput });
  }

  handleDoneEditing() {
    this.dialogRef.close();
  }
}
