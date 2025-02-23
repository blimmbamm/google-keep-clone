import { Component, input, output, viewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { Note, NoteInput } from '../../../../data/notes';
import { MatRipple } from '@angular/material/core';
import { MatBadge } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-change-background-color-action',
  imports: [
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatRipple,
    MatBadge,
    MatTooltipModule,
  ],
  templateUrl: './change-background-color-action.component.html',
  styleUrl: './change-background-color-action.component.scss',
})
export class ChangeBackgroundColorActionComponent {
  readonly COLORS = [
    '#faafa8',
    '#f39f76',
    '#fff8b8',
    '#e2f6d3',
    '#b4ddd3',
    '#d4e4ed',
    '#aeccdc',
    '#d3bfdb',
    '#f6e2dd',
    '#e9e3d4',
    '#efeff1',
  ];

  readonly note = input<Note>();

  readonly onChangeNoteBackgroundColor = output<NoteInput>();
  readonly onToggleMenu = output();

  readonly menuTrigger = viewChild.required(MatMenuTrigger);

  doNotPropagate(event: MouseEvent) {
    event.stopPropagation();
  }

  handleCloseMenu() {
    this.menuTrigger().closeMenu();
  }

  handleChangeBackgroundColor(color?: string) {
    this.onChangeNoteBackgroundColor.emit({ backgroundColor: color });
  }
}
