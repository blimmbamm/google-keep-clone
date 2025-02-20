import { inject, Injectable } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { map, Observable, tap } from 'rxjs';
import { labelExists } from '../../data/label';

export interface NotesQueryParams {
  labelName: string | null;
  trash: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class NavigationService {
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  /**
   * Emits the fragment. If the fragment is #label/<SomeLabel>,
   * only the label name is returned
   */
  readonly fragment$ = this.route.fragment.pipe(
    map((fragment) => {
      const label = fragment && fragment.match(/^label\/(\w+)$/)?.[1];
      return label || fragment;
    })
  );

  readonly trash$ = this.fragment$.pipe(
    map((fragment) => fragment === 'trash')
  );

  readonly title$ = this.fragment$.pipe(
    map((fragment) => {
      return fragment && fragment[0].toUpperCase() + fragment.slice(1);
    })
  );

  // Depending on fragment, construct label/trash parameters for fetching data
  readonly notesParamsObs$: Observable<NotesQueryParams> = this.fragment$.pipe(
    map((fragment) => {
      const labelName = fragment && fragment !== 'trash' ? fragment : null;
      const trash = fragment === 'trash';

      return { labelName, trash };
    }),
    tap(({ labelName }) => {
      /**
       * If label doesn't exist, navigate home. This actually is a "backend" call
       * and since it is not wrapped with useQuery or useParametrizedQuery, errors are
       * not handled.
       *
       * There could be some `ErrorService` that could be notified here, but since also
       * the other label queries will fail in case we have an error here, the common cause
       * will be handled.
       */
      try {
        labelName &&
          !labelExists(labelName) &&
          this.navigate({ labelName: null, trash: false });
      } catch {}
    })
  );

  /**
   * Returns snapshot of current fragment transformed to label/trash params
   * that are used for fetching notes.
   */
  notesParamsSnapshot(): NotesQueryParams {
    let fragment = this.route.snapshot.fragment;
    const labelName =
      (fragment && fragment.match(/^label\/(\w+)$/)?.[1]) || null;
    const trash = fragment === 'trash';
    return { labelName, trash };
  }

  navigate(params: NotesQueryParams) {
    const { labelName, trash } = params;

    let fragment: string | undefined = undefined;
    if (labelName) {
      fragment = `label/${labelName}`;
    } else if (trash) {
      fragment = 'trash';
    }

    this.router.navigate([], { fragment });
  }
}
