import { MatSnackBar } from '@angular/material/snack-bar';
import { NavigationService } from './navigation.service';
import { QueryService } from './query.service';
import { TestBed } from '@angular/core/testing';
import {
  interval,
  merge,
  of,
  Subject,
  take,
  tap,
  throwError,
} from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

describe('QueryService', () => {
  let service: QueryService;
  const openSnackBarSpy = jasmine.createSpy('open');

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        QueryService,
        {
          provide: NavigationService,
          useValue: {
            notesParamsSnapshot: jasmine
              .createSpy('notesParamsSnapshot')
              .and.returnValue({ labelName: null, trash: false }),
          },
        },
        {
          provide: MatSnackBar,
          useValue: {
            open: openSnackBarSpy.and.returnValue({
              onAction: () => of(),
            }),
          },
        },
      ],
    });

    service = TestBed.inject(QueryService);
  });

  describe('useParametrizedQuery', () => {
    it('data$ should emit data for each emission of paramsObs', (done) => {
      const paramsObs = new Subject<void>();
      const httpObsFn = () => of('testData');
      const queryKey = () => ['test-key'];
      const emittedValues: (string | null)[] = [];

      const { data$ } = service.useParametrizedQuery({
        paramsObs,
        httpObsFn,
        queryKey,
      });

      data$.pipe(take(3)).subscribe({
        next: (value) => {
          emittedValues.push(value);
        },
        complete: () => {
          expect(emittedValues).toEqual(['testData', 'testData', 'testData']);
          done();
        },
      });

      interval(500)
        .pipe(
          tap(() => {
            paramsObs.next();
          })
        )
        .subscribe();
    });

    it('data$ and loading$ should emit in the right order', (done) => {
      const paramsObs = new Subject<void>();
      const httpObsFn = () => of('testData');
      const queryKey = () => ['test-key'];
      const emittedValues: (string | null | boolean)[] = [];

      const { data$, loading$ } = service.useParametrizedQuery({
        paramsObs,
        httpObsFn,
        queryKey,
      });

      merge(data$, loading$)
        .pipe(take(7))
        .subscribe({
          next: (value) => {
            emittedValues.push(value);
          },
          complete: () => {
            expect(emittedValues).toEqual([
              true, // this is because loading is a BehaviorSubject
              true,
              false,
              'testData',
              true,
              false,
              'testData',
            ]);
            done();
          },
        });

      interval(500)
        .pipe(
          tap(() => {
            paramsObs.next();
          })
        )
        .subscribe();
    });

    it('error$ should emit first null and then an error if httpObsFn emits an error', (done) => {
      const paramsObs = new Subject<void>();
      const error = new HttpErrorResponse({});
      const httpObsFn = () => throwError(() => error);
      const queryKey = () => ['test-key'];
      const emittedErrorValues: (HttpErrorResponse | null)[] = [];

      const { data$, error$ } = service.useParametrizedQuery({
        paramsObs,
        httpObsFn,
        queryKey,
      });

      error$.pipe(take(2)).subscribe({
        next: (value) => {
          emittedErrorValues.push(value);
        },
        complete: () => {
          expect(emittedErrorValues).toEqual([null, error]);
          done();
        },
      });

      // Data has to be subscribed because otherwise nothing gets emitted for error$
      data$.subscribe();

      interval(500)
        .pipe(
          tap(() => {
            paramsObs.next();
          })
        )
        .subscribe();
    });

    it(`data$, loading$ and error$ should emit in the correct order`, (done) => {
      const paramsObs = new Subject<void>();
      const error = new HttpErrorResponse({});
      const httpObsFn = () => throwError(() => error);
      const queryKey = () => ['test-key'];
      const emittedValues: (HttpErrorResponse | null | string | boolean)[] = [];

      const { data$, loading$, error$ } = service.useParametrizedQuery({
        paramsObs,
        httpObsFn,
        queryKey,
      });

      merge(data$, loading$, error$)
        .pipe(take(6))
        .subscribe({
          next: (value) => {
            emittedValues.push(value);
          },
          complete: () => {
            expect(emittedValues).toEqual([
              true, // this is because loading is a BehaviorSubject
              null, // initial null error
              true, // loading
              error,
              false, // loading
              null, // data
            ]);
            done();
          },
        });

      interval(500)
        .pipe(
          tap(() => {
            paramsObs.next();
          })
        )
        .subscribe();
    });

    it(`data$ should emit data again if query is invalidated`, (done) => {
      const paramsObs = of(null);
      const httpObsFn = () => of('testData');
      const queryKey = () => ['test-key'];
      const emittedValues: (string | null)[] = [];

      const { data$ } = service.useParametrizedQuery({
        paramsObs,
        httpObsFn,
        queryKey,
      });

      data$.pipe(take(2)).subscribe({
        next: (value) => {
          emittedValues.push(value);
        },
        complete: () => {
          expect(emittedValues).toEqual(['testData', 'testData']);
          done();
        },
      });

      setTimeout(() => {
        service.invalidateQuery(['test-key']);
      }, 500);
    });
  });

  describe('globalError$', () => {
    it(`snackbar should be opened when error is emitted`, (done) => {
      service.globalError$.next();
      expect(openSnackBarSpy).toHaveBeenCalled();
      done();
    });
  });
});
