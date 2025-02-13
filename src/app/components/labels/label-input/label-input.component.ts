import {
  Component,
  input,
  ViewEncapsulation,
} from '@angular/core';

@Component({
  selector: 'app-label-input',
  imports: [],
  templateUrl: './label-input.component.html',
  styleUrl: './label-input.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class LabelInputComponent {
  readonly error = input<Error>();
}
