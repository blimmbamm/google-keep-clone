import { inject, Injectable } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { map, Observable } from 'rxjs';

interface NotesQueryParams {
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

  navigate(label?: string, trash?: boolean) {
    const fragment =
      (trash || label) && ((trash && 'trash') || (label && `label/${label}`));

    this.router.navigate([], { fragment });
  }
}
