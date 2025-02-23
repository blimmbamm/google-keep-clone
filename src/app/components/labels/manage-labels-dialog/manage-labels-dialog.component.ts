import { Component, inject, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { MAT_DIALOG_DATA, MatDialogClose } from '@angular/material/dialog';
import { AsyncPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { Label } from '../../../../data/label';
import { AddLabelComponent } from '../add-label/add-label.component';
import { EditLabelComponent } from '../edit-label/edit-label.component';
import { LabelOrNewLabel } from '../mutate-label.directive';

export interface ManageLabelsDialogData {
  labels$: Observable<Label[] | null>;
}

/**
 * Dialog to manage (edit/remove) the list of existing labels 
 * and to add new labels. 
 */
@Component({
  selector: 'app-manage-labels-dialog',
  imports: [
    AsyncPipe,
    MatButtonModule,
    MatIconModule,
    AddLabelComponent,
    EditLabelComponent,
    MatDialogClose,
  ],
  templateUrl: './manage-labels-dialog.component.html',
  styleUrl: './manage-labels-dialog.component.scss',
})
export class ManageLabelsDialogComponent {
  readonly data = inject<ManageLabelsDialogData>(MAT_DIALOG_DATA);

  /** 
   * This represents the label that is currently being worked on, 
   * what roughly means the label whose input is focussed. 
   */
  readonly currentLabel = signal<LabelOrNewLabel | null>(null);
}
