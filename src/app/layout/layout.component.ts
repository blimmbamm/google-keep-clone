import {
  AfterContentInit,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  viewChild,
} from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { SidenavComponent } from '../components/sidenav/sidenav.component';
import { delay, fromEvent, map, repeat, takeUntil, tap } from 'rxjs';
import { getNavMenuOpenState, setNavMenuOpenState } from '../db';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { AsyncPipe } from '@angular/common';
import { NavigationService } from '../services/navigation.service';
import { SearchbarComponent } from '../components/searchbar/searchbar.component';

@Component({
  selector: 'app-layout',
  imports: [
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    SidenavComponent,
    AsyncPipe,
    SearchbarComponent,
  ],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss',
})
export class LayoutComponent implements AfterContentInit {

  readonly navigation = inject(NavigationService);

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
   * When construction component: get that information from localStorage (if exists)
   */
  sideNavOpen = getNavMenuOpenState();

  /** Whether the drawer is expanded (icons + text) or not (only icons) */
  sideNavExpanded = this.sideNavOpen; //

  sideNav = viewChild.required(SidenavComponent, { read: ElementRef });

  destroyRef = inject(DestroyRef);

  /**
   * Mobile breakpoint stream (600px).
   *
   * When falling below mobile breakpoint, close sidenav as side-effect.
   */
  mobile$ = inject(BreakpointObserver)
    .observe(Breakpoints.XSmall)
    .pipe(
      map((state) => state.matches),
      tap((matches) => {
        if (matches) {
          this.sideNavOpen = false;
          this.sideNavExpanded = false;
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
    this.sideNavOpen = !this.sideNavOpen;
    this.sideNavExpanded = !this.sideNavExpanded;
    setNavMenuOpenState(this.sideNavOpen);
  }

  /**
   * Expand Menu if it is in non-opened state (collapsed when not hovered)
   */
  expandNonOpenedMenu() {
    if (!this.sideNavOpen) {
      this.sideNavExpanded = true;
    }
  }

  /**
   * Collapse menu if it is in non-opened state (collapsed when not hovered)
   */
  collapseNonOpenedMenu() {
    if (!this.sideNavOpen) {
      this.sideNavExpanded = false;
    }
  }

  ngAfterContentInit(): void {
    // Stream omitting when mouse leaves side nav
    // If side nav is not opened, it will be collapsed
    const leave$ = fromEvent(this.sideNav().nativeElement, 'mouseleave').pipe(
      tap(() => this.collapseNonOpenedMenu())
    );

    // Schedule expandation of non-opened sidenav when hovering,
    // but cancel process if mouse leaves again within 300ms
    const mouseEnterSubscription = fromEvent(
      this.sideNav().nativeElement,
      'mouseenter'
    )
      .pipe(delay(300), takeUntil(leave$), repeat())
      .subscribe(() => {
        this.expandNonOpenedMenu();
      });

    // Clean up the subscription
    this.destroyRef.onDestroy(() => mouseEnterSubscription.unsubscribe());
  }
}
