import { Directive, inject, input } from '@angular/core';

import { Note } from '../../../../data/notes';
import { NotesService } from '../../../services/notes/notes.service';

@Directive({
  selector: '[appCreateCopyAction]',
  host: {
    '(click)': 'handleCreateCopy($event, note())',
  },
})
export class CreateCopyActionDirective {
  private notesService = inject(NotesService);

  readonly note = input.required<Note>();

  handleCreateCopy(event: MouseEvent, note: Note) {
    event.stopPropagation();

    const noteCopy = { ...note, id: Date.now() };
    if (noteCopy.title) {
      noteCopy.title += '(Copy)';
    } else {
      noteCopy.title = '(Copy)';
    }

    this.notesService.addNote(noteCopy);
  }
}
