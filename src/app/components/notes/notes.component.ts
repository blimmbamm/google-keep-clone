import { Component, inject } from '@angular/core';
import { getNotes, seedNotes } from '../../../data/notes';
import { QueryService } from '../../services/query.service';
import { NavigationService } from '../../services/navigation.service';
import { map } from 'rxjs';
import { AsyncPipe } from '@angular/common';

@Component({
  selector: 'app-notes',
  imports: [AsyncPipe],
  templateUrl: './notes.component.html',
  styleUrl: './notes.component.scss',
})
export class NotesComponent {
  private queryService = inject(QueryService);
  private navigationService = inject(NavigationService);

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
    seedNotes();
  }
}
