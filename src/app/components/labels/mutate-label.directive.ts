import {
  AfterContentInit,
  computed,
  DestroyRef,
  Directive,
  ElementRef,
  inject,
  InputSignal,
  model,
  viewChild,
} from '@angular/core';
import { filter, fromEvent } from 'rxjs';
import { Label } from '../../../data/label';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';

export type LabelOrNewLabel = Label | 'new-label';

/**
 * Directive that holds the shared logic for adding a new or editing
 * an existing label.
 */
@Directive()
export abstract class MutateLabelDirective<T extends LabelOrNewLabel>
  implements AfterContentInit
{
  /**
   * This needs to be set in the implementing class. Either of type `Label`,
   * if editing an existing label or fixed value of `"new-label"` if adding
   * a new one.
   */
  abstract label: InputSignal<T>;

  private destroyRef = inject(DestroyRef);

  /** Reference to the html input element */
  readonly inputElement =
    viewChild.required<ElementRef<HTMLInputElement>>('input');

  /**
   * The currently 'activated/selected' label input component, i.e.
   * the input component the user currently works with. Only one
   * such component is selected at a time.
   */
  readonly currentLabel = model.required<LabelOrNewLabel | null>();

  /**
   * Whether the label that is currently being worked on is the same
   * as that of the implementing component.
   */
  readonly active = computed(() => this.currentLabel() === this.label());

  /** Observable that emits if label input component gets deactivated. */
  readonly deactivate$ = toObservable(this.active).pipe(
    takeUntilDestroyed(),
    filter((value) => !value)
  );

  /**
   * Set the current label to that of the implementing component.
   */
  activate() {
    this.currentLabel.set(this.label());
    this.inputElement().nativeElement.focus();
  }

  /** Sets the current label no null. */
  deactivate() {
    this.currentLabel.set(null);
  }

  /** Activate this label if the input gets focussed. */
  ngAfterContentInit(): void {
    const focusInputSubscription = fromEvent(
      this.inputElement().nativeElement,
      'focus'
    ).subscribe(() => this.activate());

    this.destroyRef.onDestroy(() => focusInputSubscription.unsubscribe());
  }
}
