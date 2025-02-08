import { Component, input } from '@angular/core';
import { Label } from '../../../../data/label';

@Component({
  selector: 'app-labels-stack',
  imports: [],
  templateUrl: './labels-stack.component.html',
  styleUrl: './labels-stack.component.scss'
})
export class LabelsStackComponent {
  readonly labels = input.required<Label[]>();
}
