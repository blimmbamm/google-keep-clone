import { Component, inject } from '@angular/core';
import { getNotes, seedNotes } from '../../../data/notes';
import { QueryService } from '../../services/query.service';
import { NavigationService } from '../../services/navigation.service';
import { AsyncPipe } from '@angular/common';
import { NoteComponent } from '../note/note.component';
import { AddNoteComponent } from '../add-note/add-note.component';
import { LocalStorageKeys } from '../../../data/shared';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-notes',
  imports: [NoteComponent, AsyncPipe, AddNoteComponent, MatIconModule],
  templateUrl: './notes.component.html',
  styleUrl: './notes.component.scss',
})
export class NotesComponent {
  private queryService = inject(QueryService);
  readonly navigationService = inject(NavigationService);

  readonly notesQuery = this.queryService.useParametrizedQuery({
    paramsObs: this.navigationService.notesParamsObs$,
    httpObsFn: (params) => getNotes(params),
    queryKey: (params) => this.queryService.getNotesQueryKey(params),
  });

  constructor() {
    if (!localStorage.getItem(LocalStorageKeys.NOTES)) {
      seedNotes();
    }
  }
}
