import { Component, DestroyRef, ElementRef, inject, viewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { editNote, Note, NoteInput } from '../../../data/notes';
import { MatButtonModule } from '@angular/material/button';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ContenteditableValueAccessorModule } from '@tinkoff/angular-contenteditable-accessor';
import { debounceTime } from 'rxjs';
import { QueryService } from '../../services/query.service';
import { NavigationService } from '../../services/navigation.service';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-edit-note',
  imports: [
    MatButtonModule,
    ReactiveFormsModule,
    ContenteditableValueAccessorModule,
    MatIconModule
  ],
  templateUrl: './edit-note.component.html',
  styleUrl: './edit-note.component.scss',
})
export class EditNoteComponent {
  readonly data: { note: Note } = inject(MAT_DIALOG_DATA);

  readonly queryService = inject(QueryService);
  readonly navigationService = inject(NavigationService);
  readonly destroyRef = inject(DestroyRef);
  readonly dialogRef = inject(MatDialogRef)

  noteForm = new FormGroup({
    title: new FormControl(this.data.note.title, { nonNullable: true }),
    content: new FormControl(this.data.note.content, { nonNullable: true }),
  });

  readonly editNoteSubscription = this.noteForm.valueChanges
    .pipe(debounceTime(500))
    .subscribe((value) => {
      this.editNoteMutation.mutate(value);
    });

  _ = this.destroyRef.onDestroy(() => this.editNoteSubscription.unsubscribe())

  

  editNoteMutation = this.queryService.useMutation({
    httpObsFn: (noteInput: NoteInput) => editNote(this.data.note.id, noteInput),
    onError: () => {},
    onSuccess: () => {
      const {label, trash} = this.navigationService.notesParamsSnapshot()
      console.log('Invalidating:')
      console.log(['notes', label, trash])
      this.queryService.invalidateQuery(['notes', label, trash]);
    },
  });

  noteContentElement = viewChild.required<string, ElementRef<HTMLDivElement>>(
    'noteContent',
    {
      read: ElementRef<HTMLDivElement>,
    }
  );

  // Disallow hitting enter (= new line) for title
  // Later, hitting enter could e.g. lead to jumping to content
  // but only if current caret position is at end of title
  checkKey(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();

      // Got to content if hitting enter and
      // goes to new line if hitting shift+enter:
      // if (!e.shiftKey) {
      //   e.preventDefault();
      //   this.noteContentElement().nativeElement.focus();
      // }
    }
  }

  ngAfterViewInit(): void {
    // Maybe go to title if there is none, else to end of content
    // For the beginning, always go to end of content
    const contentElement = this.noteContentElement().nativeElement;
    contentElement.focus();

    // This is defined as contentElement gets focussed
    const selection = document.getSelection()!;

    /**
     * Find very last child of last childs in contentElement (= text node).
     * Set caret position after last character.
     * If contentElement has no child nodes (= no content yet), 
     * set caret position to contentElement.
     */
    let lastChild = contentElement.lastChild;
    if(lastChild) {
      while (lastChild?.hasChildNodes()) {
        lastChild = lastChild?.lastChild;
      }
      selection.setPosition(lastChild, lastChild?.textContent?.length);
    } else {
      selection.setPosition(contentElement, 0)
    }
  }

  handleDoneEditing(){
    this.dialogRef.close();
  }
}
