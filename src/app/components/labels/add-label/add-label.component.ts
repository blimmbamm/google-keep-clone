import { AfterContentInit, Component, inject, input } from '@angular/core';
import { LabelInputComponent } from '../label-input/label-input.component';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { QueryService } from '../../../services/query.service';
import { addLabel, LabelInput } from '../../../../data/label';
import { AsyncPipe } from '@angular/common';
import { MutateLabelDirective } from '../mutate-label.directive';
import { ReactiveFormsModule } from '@angular/forms';

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
    AsyncPipe,
    ReactiveFormsModule,
  ],
  templateUrl: './add-label.component.html',
  styleUrl: './add-label.component.scss',
})
export class AddLabelComponent
  extends MutateLabelDirective<'new-label'>
  implements AfterContentInit
{
  private queryService = inject(QueryService);

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

  /**
   * Mutation to add a new label. Errors (already existing or empty label name)
   * are displayed in the template. Labels are refetched when the new label was
   * added successfully.
   */
  readonly addLabelMutation = this.queryService.useMutation({
    httpObsFn: (labelInput: LabelInput) => addLabel(labelInput),
    onError: () => {},
    onSuccess: () => {
      this.labelNameInput.reset();
      this.queryService.invalidateQuery(['labels']);
    },
  });

  override readonly error$ = this.addLabelMutation.error$;

  /** Triggers the mutation to add the new label. */
  handleAddLabel(labelName: string) {
    this.addLabelMutation.mutate({ name: labelName });
  }
}
