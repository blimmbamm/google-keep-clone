import { Directive, inject, input } from '@angular/core';
import { addNote, Note, NoteInput } from '../../../../data/notes';
import { QueryService } from '../../../services/query.service';

@Directive({
  selector: '[appCreateCopyAction]',
  host: {
    '(click)': 'handleCreateCopy($event, note())',
  },
})
export class CreateCopyActionDirective {
  private queryService = inject(QueryService);

  readonly note = input.required<Note>();

  readonly createCopyMutation = this.queryService.useMutation({
    httpObsFn: (noteInput: NoteInput) => addNote(noteInput),
    onError: () => {},
    onSuccess: () => {
      this.queryService.refetchCurrentNotes();
    },
  });

  handleCreateCopy(event: MouseEvent, note: Note) {
    event.stopPropagation();

    const noteCopy = { ...note };
    noteCopy.title += '(Copy)';

    this.createCopyMutation.mutate(noteCopy);
  }
}
