import {
  AfterContentInit,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  viewChild,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { fromEvent, map, merge } from 'rxjs';

@Component({
  selector: 'app-searchbar',
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './searchbar.component.html',
  styleUrl: './searchbar.component.scss',
  host: {
    '[class.focussed]': 'inputFocussed',
  },
})
export class SearchbarComponent implements AfterContentInit {
  private destroyRef = inject(DestroyRef);

  readonly input =
    viewChild.required<ElementRef<HTMLInputElement>>('searchInput');

  /**
   * Whether the input is focussed. This is needed because the host element is 
   * styled based on the input (its child) focus state and will be set with rxjs 
   * `fromEvent` streams.
   */
  inputFocussed: boolean = false;

  /**
   * Focus the input programmatically. This is used as a callback for a 
   * mousedown event, s.t. input focus can be retained.
   */
  focusInput(event: MouseEvent) {
    event.preventDefault();
    this.input().nativeElement.focus();
  }
  
  /**
   * Clear the focus, wired up to a mousedown event, s.t. input focus
   * can be retained.
   */
  clearInput(event: MouseEvent) {
    event.preventDefault();
    this.input().nativeElement.focus();
    this.input().nativeElement.value = "";
  }


  ngAfterContentInit(): void {
    /**
     * Subscription to observable stream that emits `true/false` 
     * when input gets/loses focus
     */
    const inputFocusSubscription = merge(
      fromEvent(this.input().nativeElement, 'focus').pipe(map(() => true)),
      fromEvent(this.input().nativeElement, 'blur').pipe(map(() => false))
    ).subscribe((focussed) => {
      this.inputFocussed = focussed;
    });

    this.destroyRef.onDestroy(() => inputFocusSubscription.unsubscribe());
  }
}
