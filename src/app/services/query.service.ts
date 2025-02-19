import { HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import {
  BehaviorSubject,
  catchError,
  map,
  Observable,
  of,
  skip,
  startWith,
  switchMap,
  tap,
} from 'rxjs';
import { NavigationService, NotesQueryParams } from './navigation.service';

@Injectable({
  providedIn: 'root',
})
export class QueryService {
  private navigationService = inject(NavigationService);
  private _subjects = new Map<string, BehaviorSubject<null>>();

  getNotesQueryKey(params: NotesQueryParams) {
    return ['notes', params.labelName, params.trash];
  }

  getLabelsQueryKey() {
    return ['labels'];
  }

  /**
   * Gets current snapshot of note params (all/label/trash) and invalidates
   * the respective notes query.
   */
  refetchCurrentNotes() {
    const params = this.navigationService.notesParamsSnapshot();
    this.invalidateQuery(this.getNotesQueryKey(params));
    return params;
  }

  /**
   * Forces all labels queries to be re-executed.
   */
  refetchLabels() {
    this.invalidateQuery(this.getLabelsQueryKey());
  }

  /**
   * Alternate version of `useQuery` using subjects for loading and error state.
   */
  useStandardQuery<T>(args: { httpObs: Observable<T>; queryKey: unknown }) {
    const loading$ = new BehaviorSubject(true);
    const error$ = new BehaviorSubject<HttpErrorResponse | null>(null);

    const data$ = this.getSubject(args.queryKey).pipe(
      switchMap(() =>
        args.httpObs.pipe(
          catchError((error: HttpErrorResponse) => {
            error$.next(error);
            return of(null);
          }),
          tap(() => loading$.next(false))
        )
      )
    );

    return { data$, loading$, error$ };
  }

  /**
   * Function that returns observable objects (Observables/Subjects) for data, loading
   * and error state of a query that can be subscribed independently.
   *
   * Use case are queries that depend on other observable streams of parameters
   * (like URL query params) and should update if those parameters change
   */
  useParametrizedQuery<S, T>(args: {
    paramsObs: Observable<S>;
    httpObsFn: (params: S) => Observable<T>;
    queryKey: (params: S) => unknown;
  }) {
    // Subjects for loading and error:
    const loading$ = new BehaviorSubject(true);
    const error$ = new BehaviorSubject<HttpErrorResponse | null>(null);

    // Observable for the actual data.
    // Is set to null initially and if params update (i.e. if data is refetched)
    let data$: Observable<T | null>;

    // params => query subject => params => data
    data$ = args.paramsObs
      .pipe(
        switchMap((params) =>
          this.getSubject(args.queryKey(params)).pipe(map(() => params))
        )
      )
      .pipe(
        tap(() => {
          loading$.next(true);
        }),
        switchMap((params) =>
          args.httpObsFn(params).pipe(
            startWith(null),
            catchError((error: HttpErrorResponse) => {
              error$.next(error);
              return of(error);
            })
          )
        ),
        map((value) => {
          // Set loading to false if either data is there or error occurred and
          // return null in case of error, data otherwise:
          if (value) {
            loading$.next(false);
            if (value instanceof HttpErrorResponse) {
              return null;
            } else {
              return value;
            }
          }
          // If data is not there yet, return null:
          return null;
        })
      );

    return { data$, loading$, error$ };
  }

  useMutation<T, S>(args: {
    httpObsFn: (inputs: S) => Observable<T>;
    onError: (error: any) => void;
    onSuccess: (data: T | null, inputs: S) => void;
  }) {
    // Subjects for data, loading and error:
    const data$ = new BehaviorSubject<T | null>(null);
    const loading$ = new BehaviorSubject(false);
    const error$ = new BehaviorSubject<HttpErrorResponse | null>(null);

    const mutate = (inputs: S) => {
      return args
        .httpObsFn(inputs)
        .pipe(
          startWith(null),
          tap((data) => {
            data$.next(data);
            error$.next(null);
            loading$.next(!Boolean(data));
          }),
          catchError((error: HttpErrorResponse) => {
            error$.next(error);
            loading$.next(false);
            throw error;
          }),
          skip(1)
        )
        .subscribe({
          next: (value) => {
            args.onSuccess(value, inputs);
          },
          error: args.onError,
        });
    };

    return {
      mutate,
      data$,
      loading$,
      error$,
    };
  }

  getSubject(queryKey: unknown) {
    /**
     * Array types, etc. of keys need to be stringified because otherwise item
     * can only be retrieved by using reference of original key
     */
    const key = JSON.stringify(queryKey);
    let subject = this._subjects.get(key);
    if (!subject) {
      subject = new BehaviorSubject(null);
      this._subjects.set(key, subject);
    }
    return subject;
  }

  /**
   * `next()` will be called for the subject with key `queryKey`. If key does not exist,
   * nothing will happen.
   *
   * In general, this only has an effect if the corresponding query is currently subscribed
   *
   * @param queryKey Key of query that should be invalidated/refetched
   */
  invalidateQuery(queryKey: unknown) {
    this._subjects.get(JSON.stringify(queryKey))?.next(null);
  }
}
