import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { LayoutComponent } from './layout.component';
import { NavigationService } from '../services/navigation.service';
import { QueryService } from '../services/query.service';

import { BreakpointObserver } from '@angular/cdk/layout';
import { BehaviorSubject, delay, of, Subject, tap } from 'rxjs';
import { By } from '@angular/platform-browser';
import { input } from '@angular/core';

import { Component } from '@angular/core';
import { NotesComponent } from '../components/notes/notes.component';
import { SidenavComponent } from '../components/sidenav/sidenav.component';
import { NO_ERRORS_SCHEMA } from '@angular/compiler';
import { SearchbarComponent } from '../components/searchbar/searchbar.component';
import { AboutComponent } from '../components/about/about.component';

@Component({
  selector: 'app-notes',
  template: '',
})
class MockNotesComponent {}

@Component({
  selector: 'app-sidenav',
  template: '<div></div>',
})
class MockSideNavComponent {
  // nativeElement = {}
  expanded = input<boolean>(false);
  open = input<boolean>(false);
  mobile = input<boolean>(false);
}

@Component({
  selector: 'app-searchbar',
  template: '',
})
class MockSearchbarComponent {}

@Component({
  selector: 'app-about',
  template: '',
})
class MockAboutComponent {}

describe('LayoutComponent', () => {
  let component: LayoutComponent;
  let fixture: ComponentFixture<LayoutComponent>;
  let queryService: QueryService;

  const breakpointSubject = new Subject<{ matches: boolean }>();

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [LayoutComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        // ElementRef could be provided like this
        // {
        //   provide: ElementRef,
        //   useValue: {nativeElement: document.createElement('div')}
        // },
        {
          provide: NavigationService,
          useValue: {
            title$: of('Some title'),
          },
        },
        {
          provide: QueryService,
          useValue: {
            globalLoading$: new BehaviorSubject(false),
            useParametrizedQuery: jasmine
              .createSpy('useParametrizedQuery')
              .and.returnValue({
                data$: of(null),
                loading$: of(false),
                error$: of(null),
              }),
          },
        },
        {
          provide: BreakpointObserver,
          useValue: {
            observe: () => breakpointSubject,
          },
        },
      ],
    })
      .overrideComponent(LayoutComponent, {
        remove: {
          imports: [
            NotesComponent,
            SidenavComponent,
            SearchbarComponent,
            AboutComponent,
          ],
        },
        add: {
          imports: [
            MockNotesComponent,
            MockSideNavComponent,
            MockSearchbarComponent,
            MockAboutComponent,
          ],
        },
      })
      // Components can also be overwritten like this:
      // .overrideComponent(NotesComponent, {
      //   set: { template: '', selector: 'app-notes' },
      // })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LayoutComponent);
    component = fixture.componentInstance;
    queryService = TestBed.inject(QueryService);
    fixture.detectChanges();

    spyOn(component, 'sideNav').and.returnValue({
      nativeElement: document.createElement('div'),
    });
  });

  afterEach(() => {
    fixture.destroy(); // Ensures the component is properly cleaned up
    TestBed.resetTestingModule(); // Cleans up the test module
  });

  it('component should be created', () => {
    expect(component).toBeDefined();
  });

  it('title should be "Some title", i.e. based on title$', (done) => {
    const titleElement = fixture.debugElement.query(By.css('[class="title"]'))
      .nativeElement as HTMLSpanElement;
    expect(titleElement.innerText).toEqual('Some title');
    done();
  });

  it(`entering and leaving mouse for sidenav component should make sidenav
      expand/collapse correctly if sidenav is not opened`, (done) => {
    component.sideNavOpen.set(false);

    const sideNavElement = fixture.debugElement.query(
      By.directive(MockSideNavComponent)
    ).nativeElement as HTMLElement;

    const expandNonOpenedMenuSpy = spyOn(component, 'expandNonOpenedMenu');
    const collapseNonOpenedMenuSpy = spyOn(component, 'collapseNonOpenedMenu');

    const mouseEnterEvent = new Event('mouseenter');
    const mouseLeaveEvent = new Event('mouseleave');

    /**
     * Flows:
     * 1. mouseenter > mouseleave with less than 300ms
     * 2. mouseenter > mouseleave with more than 300ms
     * 3. mouseenter > mouseleave x2
     */
    const mouseEnterEffect = tap(() =>
      sideNavElement.dispatchEvent(mouseEnterEvent)
    );
    const mouseLeaveEffect = tap(() =>
      sideNavElement.dispatchEvent(mouseLeaveEvent)
    );

    of(null)
      .pipe(
        // 1. mouseenter > mouseleave with less than 300ms
        mouseEnterEffect,
        delay(250),
        mouseLeaveEffect,
        tap(() => {
          expect(component.expandNonOpenedMenu).not.toHaveBeenCalled();
          expect(component.collapseNonOpenedMenu).toHaveBeenCalled();
          expandNonOpenedMenuSpy.calls.reset();
          collapseNonOpenedMenuSpy.calls.reset();
        }),

        // 2. mouseenter > mouseleave with more than 300ms
        mouseEnterEffect,
        delay(300),
        mouseLeaveEffect,
        tap(() => {
          expect(component.expandNonOpenedMenu).toHaveBeenCalled();
          expect(component.collapseNonOpenedMenu).toHaveBeenCalled();
          expandNonOpenedMenuSpy.calls.reset();
          collapseNonOpenedMenuSpy.calls.reset();
        }),

        // 3. check that listening continues after one enter/leave cycle
        mouseEnterEffect,
        delay(300),
        mouseLeaveEffect,
        delay(100),
        mouseEnterEffect,
        delay(300),
        mouseLeaveEffect,
        tap(() => {
          expect(component.expandNonOpenedMenu).toHaveBeenCalledTimes(2);
          expect(component.collapseNonOpenedMenu).toHaveBeenCalledTimes(2);
          done();
        })
      )
      .subscribe();
  });

  it('loading signal should update based on globalLoading$', () => {
    queryService.globalLoading$.next(true);
    expect(component.loading()).toBeTrue();

    queryService.globalLoading$.next(false);
    expect(component.loading()).toBeFalse();
  });

  it('toggling sideNav should toggle sideNavOpen and sideNavExpanded', () => {
    localStorage.clear(); // initial sideNavOpen state is false if not found in localStorage
    component.toggleSideNav();
    expect(component.sideNavOpen()).toBeTrue();
    expect(component.sideNavExpanded()).toBeTrue();

    component.toggleSideNav();
    expect(component.sideNavOpen()).toBeFalse();
    expect(component.sideNavExpanded()).toBeFalse();
  });

  it('expandNonOpenedMenu should expand menu if sidenav is not opened', () => {
    component.sideNavOpen.set(false);
    component.expandNonOpenedMenu();
    expect(component.sideNavExpanded()).toBeTrue();
  });

  it('collapseNonOpenedMenu should collapse menu if sidenav is not opened', () => {
    component.sideNavOpen.set(false);
    component.collapseNonOpenedMenu();
    expect(component.sideNavExpanded()).toBeFalse();
  });

  it(`sidenav should close if mobile breakpoint XSmall 
      is hit and if sidenav previously was opened`, () => {
    // Set open state to true and then cause a emission of XSmall breakpoint match
    component.sideNavOpen.set(true);
    component.sideNavExpanded.set(true);

    breakpointSubject.next({ matches: true });

    // Verify that sideNavOpen and sideNavExpanded are set to false
    expect(component.sideNavOpen()).toBeFalse();
    expect(component.sideNavExpanded()).toBeFalse();
  });
});
