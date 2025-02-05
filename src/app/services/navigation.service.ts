import { inject, Injectable } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class NavigationService {
  private route = inject(ActivatedRoute);
  private router = inject(Router);

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

  navigate(label?: string, trash?: boolean) {
    const fragment =
      (trash || label) && ((trash && 'trash') || (label && `label/${label}`));

    this.router.navigate([], { fragment });
  }
}
