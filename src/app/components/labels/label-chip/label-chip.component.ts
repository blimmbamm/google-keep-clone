import { Component, input, output } from '@angular/core';
import { MatRippleModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-label-chip',
  imports: [MatIconModule, MatRippleModule],
  templateUrl: './label-chip.component.html',
  styleUrl: './label-chip.component.scss',
  host: {
    '[class.disabled]': 'disabled()',
  }
})
export class LabelChipComponent {
  readonly disabled = input(false);
  readonly onRemoveChip = output();

  handleRemoveChip(event: MouseEvent){
    event.stopPropagation();
    this.onRemoveChip.emit();
  }
}
