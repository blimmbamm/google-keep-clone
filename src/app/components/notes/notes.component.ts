import { Component, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

import { NavigationService } from '../../services/navigation.service';
import { NoteComponent } from '../note/note.component';
import { AddNoteComponent } from '../add-note/add-note.component';
import { NotesService } from '../../services/notes/notes.service';

@Component({
  selector: 'app-notes',
  imports: [NoteComponent, AsyncPipe, AddNoteComponent, MatIconModule],
  templateUrl: './notes.component.html',
  styleUrl: './notes.component.scss',
})
export class NotesComponent {
  readonly navigationService = inject(NavigationService);

  readonly notes = inject(NotesService).notes;
}
