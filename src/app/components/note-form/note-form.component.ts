import {
  Component,
  DestroyRef,
  ElementRef,
  inject,
  input,
  output,
  viewChild,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Note, NoteInput } from '../../../data/notes';
import { ContenteditableValueAccessorModule } from '@tinkoff/angular-contenteditable-accessor';
import { debounceTime, skip } from 'rxjs';

@Component({
  selector: 'app-note-form',
  imports: [ReactiveFormsModule, ContenteditableValueAccessorModule],
  templateUrl: './note-form.component.html',
  styleUrl: './note-form.component.scss',
})
export class NoteFormComponent {
  readonly destroyRef = inject(DestroyRef);

  // Form controls cannot be initialized with input data because
  // it is not available yet when constructing the component
  readonly note = input.required<Note>();
  // readonly data: { note: Note } = inject(MAT_DIALOG_DATA);
  // note = this.data.note

  noteForm = new FormGroup({
    title: new FormControl<string | undefined>('', { nonNullable: true }),
    content: new FormControl<string | undefined>('', { nonNullable: true }),
  });

  ngOnInit() {
    this.noteForm.controls.title.setValue(this.note().title);
    this.noteForm.controls.content.setValue(this.note().content);
  }

  // contenteditable element for note content:
  noteContentElement = viewChild.required<string, ElementRef<HTMLDivElement>>(
    'noteContent',
    {
      read: ElementRef<HTMLDivElement>,
    }
  );

  onNoteInputChange = output<NoteInput>();

  readonly editNoteSubscription = this.noteForm.valueChanges
    .pipe(debounceTime(500), skip(1))
    .subscribe((value) => {
      console.log('emitting');
      this.onNoteInputChange.emit(value);
    });

  _ = this.destroyRef.onDestroy(() => this.editNoteSubscription.unsubscribe());

  handleEnterKey(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
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
    if (lastChild) {
      while (lastChild?.hasChildNodes()) {
        lastChild = lastChild?.lastChild;
      }
      selection.setPosition(lastChild, lastChild?.textContent?.length);
    } else {
      selection.setPosition(contentElement, 0);
    }
  }
}
