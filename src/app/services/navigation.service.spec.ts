import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, take } from 'rxjs';

import { NavigationService, NotesQueryParams } from './navigation.service';
import LabelApi from '../../data/label';

describe('NavigationService', () => {
  let service: NavigationService;
  let router: Router;
  let activatedRoute: ActivatedRoute;
  let fragmentSubject: Subject<string | null>;
  let routerNavigateSpy: jasmine.Spy;

  beforeEach(() => {
    fragmentSubject = new Subject<string | null>();
    routerNavigateSpy = jasmine.createSpy('navigate');

    TestBed.configureTestingModule({
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            // fragment: of('label/testLabel', 'trash', '', null),
            fragment: fragmentSubject.asObservable(),
            snapshot: {
              fragment: 'label/testLabel',
            },
          },
        },
        {
          provide: Router,
          useValue: {
            navigate: routerNavigateSpy,
          },
        },
      ],
    });

    service = TestBed.inject(NavigationService);
    router = TestBed.inject(Router);
    activatedRoute = TestBed.inject(ActivatedRoute);

    // serviceSpy = spyOn(service, 'navigate').and.callThrough();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('fragment$', () => {
    it('should emit the correct fragment', (done) => {
      const fragments = ['label/testLabel', 'trash', '', null];
      const expectedResults = ['testLabel', 'trash', '', null];
      const results: Array<string | null> = [];

      service.fragment$.pipe(take(fragments.length)).subscribe({
        next: (fragment) => results.push(fragment),
        complete: () => {
          expect(results).toEqual(expectedResults);
          done();
        },
      });

      fragments.forEach((fragment) => fragmentSubject.next(fragment));
    });
  });

  describe('trash$', () => {
    it('should emit true for fragment "trash" and false otherwise', (done) => {
      service.trash$.pipe(take(1)).subscribe((value) => {
        expect(value).toBeTrue();
      });

      fragmentSubject.next('trash');

      service.trash$.pipe(take(1)).subscribe((value) => {
        expect(value).toBeFalse();
        done();
      });

      fragmentSubject.next('anything else');
    });
  });

  describe('title$', () => {
    it('should make first letter upper case', (done) => {
      service.title$.pipe(take(1)).subscribe((title) => {
        expect(title).toEqual('Whatever');
        done();
      });
      fragmentSubject.next('whatever');
    });

    it('should emit empty string for empty string title', (done) => {
      service.title$.pipe(take(1)).subscribe((title) => {
        expect(title).toEqual('');
        done();
      });
      fragmentSubject.next('');
    });

    it('should emit null if no fragment exists', (done) => {
      service.title$.pipe(take(1)).subscribe((title) => {
        expect(title).toEqual(null);
        done();
      });
      fragmentSubject.next(null);
    });
  });

  describe('notesParamsObs$', () => {
    it('should emit the correct values', (done) => {
      const fragments = ['label/Something', 'Else', 'trash', '', null];
      const expectedResults = [
        { labelName: 'Something', trash: false },
        { labelName: 'Else', trash: false }, // actually this is weird, what happens if navigating to /#Else?
        { labelName: null, trash: true },
        { labelName: null, trash: false },
        { labelName: null, trash: false },
      ];
      const results: NotesQueryParams[] = [];

      service.notesParamsObs$.pipe(take(fragments.length)).subscribe({
        next: (fragment) => results.push(fragment),
        complete: () => {
          expect(results).toEqual(expectedResults);
          done();
        },
      });

      fragments.forEach((fragment) => fragmentSubject.next(fragment));
    });

    it('should/should not navigate home if label does not exist/does exist', (done) => {
      const serviceSpy = spyOn(service, 'navigate').and.callThrough();
      spyOn(LabelApi, 'labelExists').and.returnValues(false, true);

      service.notesParamsObs$.pipe(take(1)).subscribe(() => {
        expect(service.navigate).toHaveBeenCalledWith({
          labelName: null,
          trash: false,
        });
        serviceSpy.calls.reset();
      });

      fragmentSubject.next('label/nonExistentLabel');

      service.notesParamsObs$.pipe(take(1)).subscribe(() => {
        expect(service.navigate).not.toHaveBeenCalled();
        done();
      });

      fragmentSubject.next('label/existentLabel');
    });
  });

  describe('notesParamsSnapshot', () => {
    it('should return the correct values', (done) => {
      activatedRoute.snapshot = { fragment: 'label/someLabel' } as any;
      expect(service.notesParamsSnapshot())
        .withContext('label with label/ prefix')
        .toEqual({
          labelName: 'someLabel',
          trash: false,
        });

      activatedRoute.snapshot = { fragment: 'someLabel' } as any;
      expect(service.notesParamsSnapshot())
        .withContext('illegal fragment')
        .toEqual({
          labelName: null,
          trash: false,
        });

      activatedRoute.snapshot = { fragment: 'trash' } as any;
      expect(service.notesParamsSnapshot())
        .withContext('trash fragment')
        .toEqual({
          labelName: null,
          trash: true,
        });

      activatedRoute.snapshot = { fragment: '' } as any;
      expect(service.notesParamsSnapshot())
        .withContext('empty fragment')
        .toEqual({
          labelName: null,
          trash: false,
        });

      activatedRoute.snapshot = { fragment: null } as any;
      expect(service.notesParamsSnapshot())
        .withContext('null fragment')
        .toEqual({ labelName: null, trash: false });

      done();
    });
  });

  describe('navigate', () => {
    it('should trigger router.navigate with the correct values', (done) => {
      service.navigate({ labelName: 'label', trash: false });
      service.navigate({ labelName: 'label', trash: true });
      service.navigate({ labelName: null, trash: true });
      service.navigate({ labelName: null, trash: false });

      expect(routerNavigateSpy.calls.argsFor(0))
        .withContext('label')
        .toEqual([[], { fragment: 'label/label' }]);
      expect(routerNavigateSpy.calls.argsFor(1))
        .withContext('label AND trash')
        .toEqual([[], { fragment: 'label/label' }]);
      expect(routerNavigateSpy.calls.argsFor(2))
        .withContext('trash')
        .toEqual([[], { fragment: 'trash' }]);
      expect(routerNavigateSpy.calls.argsFor(3))
        .withContext('no label and trash false')
        .toEqual([[], { fragment: undefined }]);

      done();
    });
  });
});
