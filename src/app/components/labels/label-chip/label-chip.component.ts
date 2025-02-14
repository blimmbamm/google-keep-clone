import { Component, output } from '@angular/core';
import { MatRippleModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-label-chip',
  imports: [MatIconModule, MatRippleModule],
  templateUrl: './label-chip.component.html',
  styleUrl: './label-chip.component.scss'
})
export class LabelChipComponent {
  readonly onRemoveChip = output();
}
