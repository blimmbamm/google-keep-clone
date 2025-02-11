import { Component, inject } from '@angular/core';
import { getNotes, Note, seedNotes } from '../../../data/notes';
import { QueryService } from '../../services/query.service';
import { NavigationService } from '../../services/navigation.service';
import { map } from 'rxjs';
import { AsyncPipe } from '@angular/common';
import { NoteComponent } from '../note/note.component';
import { MatDialog } from '@angular/material/dialog';
import { EditNoteComponent } from '../edit-note/edit-note.component';
import { AddNoteComponent } from '../add-note/add-note.component';
import { LocalStorageKeys } from '../../../data/shared';

@Component({
  selector: 'app-notes',
  imports: [NoteComponent, AsyncPipe, AddNoteComponent],
  templateUrl: './notes.component.html',
  styleUrl: './notes.component.scss',
})
export class NotesComponent {
  private queryService = inject(QueryService);
  private navigationService = inject(NavigationService);

  // Maybe put this into navigation service?
  // Depending on fragment, construct label/trash parameters for fetching data
  paramsObs$ = this.navigationService.fragment$.pipe(
    map((fragment) => {
      const label = fragment && fragment !== 'trash' ? fragment : undefined;
      const trash = fragment === 'trash' || undefined;
      return { label, trash };
    })
  );

  readonly notesQuery = this.queryService.useParametrizedQuery({
    paramsObs: this.paramsObs$,
    httpObsFn: ({ label, trash }) => getNotes(label, trash),
    queryKey: ({ label, trash }) => ['notes', label, trash],
  });

  constructor() {
    if(!localStorage.getItem(LocalStorageKeys.NOTES)) {
      seedNotes();
    }
  }

  readonly dialog = inject(MatDialog);

  openEditNoteDialog(note: Note) {
    const dialogRef = this.dialog.open<EditNoteComponent, { note: Note }>(
      EditNoteComponent,
      {
        data: { note },
        panelClass: 'edit-note-dialog-panel',
        autoFocus: false,
        width: '100%',
        maxWidth: '600px',
      }
    );
  }
}
