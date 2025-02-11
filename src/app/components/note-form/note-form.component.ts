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
import { debounceTime } from 'rxjs';

@Component({
  selector: 'app-note-form',
  imports: [ReactiveFormsModule, ContenteditableValueAccessorModule],
  templateUrl: './note-form.component.html',
  styleUrl: './note-form.component.scss',
})
export class NoteFormComponent {
  readonly destroyRef = inject(DestroyRef);

  readonly note = input<Note>();
  readonly placeholderTitle = input<string>('Title');
  readonly placeholderContent = input<string>('Note');
  readonly withTitleInput = input(true);

  readonly focusNoteContentInput = input<boolean>();

  noteForm = new FormGroup({
    title: new FormControl<string>('', { nonNullable: true }),
    content: new FormControl<string>('', { nonNullable: true }),
  });

  ngOnInit() {
    this.noteForm.setValue(
      {
        title: this.note()?.title || '',
        content: this.note()?.content || '',
      },
      { emitEvent: false } // this prevents these "changes" to be emitted in valueChanges
    );
  }

  // contenteditable element for note content:
  noteContentElement = viewChild.required<string, ElementRef<HTMLDivElement>>(
    'noteContent',
    {
      read: ElementRef<HTMLDivElement>,
    }
  );

  onNoteInputChange = output<NoteInput>();

  readonly noteInputChangeSubscription = this.noteForm.valueChanges
    .pipe(debounceTime(500))
    .subscribe((value) => {
      this.onNoteInputChange.emit(value);
    });

  _ = this.destroyRef.onDestroy(() =>
    this.noteInputChangeSubscription.unsubscribe()
  );

  handleEnterKey(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
    }
  }

  ngAfterViewInit(): void {
    if (!this.focusNoteContentInput()) {
      return;
    }

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
