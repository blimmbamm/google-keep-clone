import { Component, input, output } from '@angular/core';
import { MatRippleModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-label-chip',
  imports: [MatIconModule, MatRippleModule, MatTooltipModule],
  templateUrl: './label-chip.component.html',
  styleUrl: './label-chip.component.scss',
  host: {
    '[class.disabled]': 'disabled()',
  },
})
export class LabelChipComponent {
  readonly disabled = input(false);
  readonly onRemoveChip = output();

  handleRemoveChip(event: MouseEvent) {
    event.stopPropagation();
    this.onRemoveChip.emit();
  }
}
