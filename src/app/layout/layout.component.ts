import {
  AfterContentInit,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { delay, fromEvent, map, repeat, takeUntil, tap } from 'rxjs';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { AsyncPipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';

import { SidenavComponent } from '../components/sidenav/sidenav.component';
import { NavigationService } from '../services/navigation.service';
import { SearchbarComponent } from '../components/searchbar/searchbar.component';
import { NotesComponent } from '../components/notes/notes.component';
import {
  getNavMenuOpenState,
  setNavMenuOpenState,
} from '../../data/side-nav-state';
import { QueryService } from '../services/query.service';
import { AboutComponent } from '../components/about/about.component';

@Component({
  selector: 'app-layout',
  imports: [
    SidenavComponent,
    SearchbarComponent,
    NotesComponent,
    AboutComponent,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    AsyncPipe,
    MatProgressSpinnerModule,
    MatTooltipModule,
  ],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss',
})
export class LayoutComponent implements AfterContentInit {
  readonly navigation = inject(NavigationService);
  readonly queryService = inject(QueryService);

  /** loading signal that reflects global loading state from queryService. */
  readonly loading = signal(false);

  _ = this.queryService.globalLoading$.subscribe((loading) => {
    this.loading.set(loading);
  });

  /**
   * #### EXPLANATION: SideNav state ####
   *
   * If sideNavOpen is true, then so is sideNavExpanded,
   * whereas sideNavExpanded can be true without sideNavOpen being true.
   * This occurs when the the non-opened drawer gets hovered.
   */

  /**
   * Whether the drawer is opened by burger menu icon.
   *
   * When constructing component: get that information from localStorage (if exists)
   */
  readonly sideNavOpen = signal(getNavMenuOpenState());

  /** Whether the drawer is expanded (icons + text) or not (only icons) */
  readonly sideNavExpanded = signal(this.sideNavOpen());

  /**
   * Cannot use shorter way here with template variable because template
   * variable returns component instance instead of html element.
   */
  // readonly sideNav = viewChild.required(SidenavComponent, { read: ElementRef });
  readonly sideNav = viewChild.required('sidenav', { read: ElementRef });

  private destroyRef = inject(DestroyRef);

  /**
   * Mobile breakpoint stream (600px).
   *
   * When falling below mobile breakpoint, close sidenav as side-effect.
   */
  readonly mobile$ = inject(BreakpointObserver)
    .observe(Breakpoints.XSmall)
    .pipe(
      map((state) => state.matches),
      tap((matches) => {
        if (matches) {
          this.sideNavOpen.set(false);
          this.sideNavExpanded.set(false);
        }
      })
    );

  /**
   * Toggle sidenav from closed to opened or vice versa.
   * This requires two state information, as explained above.
   *
   * When toggling, also store the current open state in localStorage
   */
  toggleSideNav() {
    this.sideNavOpen.update((open) => !open);
    this.sideNavExpanded.update((open) => !open);

    setNavMenuOpenState(this.sideNavOpen());
  }

  /**
   * Expand Menu if it is in non-opened state (collapsed when not hovered)
   */
  expandNonOpenedMenu() {
    if (!this.sideNavOpen()) {
      this.sideNavExpanded.set(true);
    }
  }

  /**
   * Collapse menu if it is in non-opened state (collapsed when not hovered)
   */
  collapseNonOpenedMenu() {
    if (!this.sideNavOpen()) {
      this.sideNavExpanded.set(false);
    }
  }

  ngAfterContentInit(): void {
    // Stream omitting when mouse leaves side nav
    // If side nav is not opened, it will be collapsed
    const leave$ = fromEvent(this.sideNav().nativeElement, 'mouseleave').pipe(
      tap(() => this.collapseNonOpenedMenu()),
      takeUntilDestroyed(this.destroyRef)
    );

    // Schedule expandation of non-opened sidenav when hovering,
    // but cancel process if mouse leaves again within 300ms
    fromEvent(this.sideNav().nativeElement, 'mouseenter')
      .pipe(
        delay(300),
        takeUntil(leave$),
        repeat(),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {
        this.expandNonOpenedMenu();
      });
  }
}
