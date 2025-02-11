import { Component, computed, input } from '@angular/core';
import { Note } from '../../../data/notes';
import { MatIcon } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { NoteActionsComponent } from "../note-actions/note-actions.component";

@Component({
  selector: 'app-note',
  imports: [MatButtonModule, MatIcon, NoteActionsComponent],
  templateUrl: './note.component.html',
  styleUrl: './note.component.scss',
})
export class NoteComponent {
  readonly note = input.required<Note>();

  readonly labels = computed(() =>
    this.note().labels?.length ? this.note().labels : undefined
  );

  readonly emptyNote = computed(
    () => !this.note().title && !this.note().content
  );

  openPaletteMenu(event: MouseEvent) {
    event.stopPropagation();
  }
}
