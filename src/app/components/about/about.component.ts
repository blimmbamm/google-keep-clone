import { Component, inject, TemplateRef, viewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-about',
  imports: [MatButtonModule, MatIconModule, MatDialogModule],
  templateUrl: './about.component.html',
  styleUrl: './about.component.scss',
})
export class AboutComponent {
  private dialog = inject(MatDialog);

  private template = viewChild.required('dialog', { read: TemplateRef });

  handleShowAboutDialog() {
    this.dialog.open(this.template(), {
      panelClass: 'dialog-panel',
      autoFocus: false,
    });
  }
}
