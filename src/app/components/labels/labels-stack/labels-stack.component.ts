import { Component, input, output } from '@angular/core';
import { Label } from '../../../../data/label';
import { LabelChipComponent } from '../label-chip/label-chip.component';
import { NoteInput } from '../../../../data/notes';

@Component({
  selector: 'app-labels-stack',
  imports: [LabelChipComponent],
  templateUrl: './labels-stack.component.html',
  styleUrl: './labels-stack.component.scss',
})
export class LabelsStackComponent {
  readonly labels = input.required<Label[]>();
  readonly disabled = input(false);

  readonly onRemoveLabel = output<NoteInput>();

  handleRemoveLabelFromNote(labelToBeRemoved: Label) {
    this.onRemoveLabel.emit({
      labels: this.labels().filter((label) => label.id !== labelToBeRemoved.id),
    });
  }
}
