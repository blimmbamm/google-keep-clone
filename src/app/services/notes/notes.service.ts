import { computed, inject, Injectable, signal } from '@angular/core';
import { Note, NoteInput, readNotes } from '../../../data/notes';
import { toObs } from '../../../data/shared';
import { NavigationService, NotesQueryParams } from '../navigation.service';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { DataChangeSet, DataService } from '../data/data.service';
import { QueryService } from '../query.service';
import { of } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class NotesService {
  private navigationService = inject(NavigationService);
  private queryService = inject(QueryService);
  private dataService = inject(DataService);

  readonly _notes = signal<Note[]>([]);

  filterNotes(notes: Note[], params: NotesQueryParams): Note[] {
    const { labelName, trash } = params;
    if (labelName) {
      return notes.filter(
        (note) =>
          note.labels?.map((label) => label.name).includes(labelName) &&
          note.trash === trash
      );
    } else {
      return notes.filter((note) => note.trash === trash);
    }
  }

  // Maybe this should go to NavigationService:
  private params = toSignal(this.navigationService.notesParamsObs$, {
    initialValue: { labelName: null, trash: false } as NotesQueryParams,
  });

  readonly notes = computed(() => {
    // Filter by params
    const notes = this.filterNotes(this._notes(), this.params());

    // Sort by time, i.e. by id
    return notes.sort((note1, note2) => note2.id - note1.id);
  });

  readonly editingNoteId = signal<number | null>(null);

  readonly editingNote = computed(
    () => this._notes().find((note) => note.id === this.editingNoteId())!
  );

  addNoteToState(note: Note) {
    this._notes.update((previousNotes) => {
      return [...previousNotes, note];
    });
  }

  addNote(noteInput: NoteInput, updateState: boolean = true) {
    const newNote: Note = {
      id: Date.now(),
      entity: 'note',
      ...noteInput,
      lastModified: new Date(),
      trash: false,
    };

    updateState && this.addNoteToState(newNote);

    const change: DataChangeSet = {
      entity: 'note',
      type: 'ADD',
      payload: newNote,
      id: newNote.id,
      fields: Object.keys(noteInput),
      timestamp: Date.now(),
    };

    this.dataService.change$.next(change);

    return newNote;
  }

  editNote(id: number, noteInput: NoteInput, updateState: boolean = true) {
    const modified = new Date();

    // Updating notes state happens for each key stroke
    updateState &&
      this._notes.update((previousNotes) => {
        const note = previousNotes.find((note) => note.id === id)!;
        const updatedNote: Note = {
          ...note,
          ...noteInput,
          lastModified: modified,
        };

        return [...previousNotes.filter((note) => note.id !== id), updatedNote];
      });

    const change: DataChangeSet = {
      entity: 'note',
      type: 'EDIT',
      id: id,
      fields: Object.keys(noteInput),
      payload: { ...noteInput, lastModified: modified },
      timestamp: Date.now(),
    };

    this.dataService.change$.next(change);

    return { ...noteInput, lastModified: modified };
  }

  deleteNote(id: number) {
    this._notes.update((previousNotes) => {
      return previousNotes.filter((note) => note.id !== id);
    });

    const change: DataChangeSet = {
      entity: 'note',
      type: 'DELETE',
      timestamp: Date.now(),
      fields: [],
      id: id,
    };

    this.dataService.change$.next(change);
  }

  private notesQuery = this.queryService.useParametrizedQuery({
    paramsObs: of(null),
    httpObsFn: () => toObs(readNotes)(),
    queryKey: () => 'notes',
  });

  constructor() {
    // On application launch, read notes from localStorage
    this.notesQuery.data$.pipe(takeUntilDestroyed()).subscribe((notes) => {
      notes && this._notes.set(notes);
    });
  }
}
