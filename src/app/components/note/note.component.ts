import { Component, computed, inject, input, signal } from '@angular/core';
import { editNote, Note, NoteInput } from '../../../data/notes';
import { MatIcon } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { NoteActionsComponent } from '../note-actions/note-actions.component';
import { LabelsStackComponent } from '../labels/labels-stack/labels-stack.component';
import { NoteManageLabelsActionComponent } from './note-manage-labels-action/note-manage-labels-action.component';
import { QueryService } from '../../services/query.service';
import { NavigationService } from '../../services/navigation.service';
import { DeleteNoteActionComponent } from "../delete-note-action/delete-note-action.component";

@Component({
  selector: 'app-note',
  imports: [
    MatButtonModule,
    MatIcon,
    NoteActionsComponent,
    LabelsStackComponent,
    NoteManageLabelsActionComponent,
    DeleteNoteActionComponent
],
  templateUrl: './note.component.html',
  styleUrl: './note.component.scss',
})
export class NoteComponent {
  readonly queryService = inject(QueryService);
  readonly navigationService = inject(NavigationService);

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
      const { label, trash } = this.navigationService.notesParamsSnapshot();
      this.queryService.invalidateQuery(['notes', label, trash]);
    },
  });

  openPaletteMenu(event: MouseEvent) {
    event.stopPropagation();
  }

  handleEditNote(noteInput: NoteInput) {
    this.editNoteMutation.mutate({ id: this.note().id, noteInput });
  }
}
