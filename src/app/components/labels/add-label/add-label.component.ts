import { AfterContentInit, Component, inject, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ReactiveFormsModule } from '@angular/forms';

import { LabelInputComponent } from '../label-input/label-input.component';
import { MutateLabelDirective } from '../mutate-label/mutate-label.directive';
import { LabelsService } from '../../../services/labels/labels.service';

/**
 * Component to add a label. This component shares some functionality
 * with the component to edit a new label, so the shared functionality is
 * extracted into an abstract directive, that both components inherit from.
 */
@Component({
  selector: 'app-add-label',
  imports: [
    LabelInputComponent,
    MatButtonModule,
    MatIconModule,
    ReactiveFormsModule,
  ],
  templateUrl: './add-label.component.html',
  styleUrl: './add-label.component.scss',
})
export class AddLabelComponent
  extends MutateLabelDirective<'new-label'>
  implements AfterContentInit
{
  private labelsService = inject(LabelsService);

  /** Implementation of abstract label input is needed though it won't change. */
  override label = input<'new-label'>('new-label');

  /**
   * When add label input component gets deactivated, clear input.
   * It gets deactivated by closing it manually or by activating
   * another label input component.
   *
   * Also reset error to null in that case.
   */
  _clearInputSubscription = this.deactivate$.subscribe(() => {
    this.labelNameInput.reset();
  });

  /** Triggers the mutation to add the new label. */
  handleAddLabel(labelName: string) {
    try {
      this.labelsService.addLabel({ name: labelName });
      this.labelNameInput.reset();
    } catch (error) {
      this.error.set(error as Error);
    }
  }
}
