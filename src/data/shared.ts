import { HttpErrorResponse } from "@angular/common/http";
import { Observable, of, throwError } from "rxjs";

export enum LocalStorageKeys {
  NOTES = 'notes',
  LABELS = 'labels',
  NAV_MENU_OPEN_STATE = 'nav_menu_open',
}
/**
 * Transforms a synchronous function to an observable version. 
 * 
 * Any errors that the function throws will also be emitted in an 
 * observable manner by throwing a `HttpErrorResponse`, like Angular's 
 * http client does.
 */
export function toObs<S extends any[], T>(
  fn: (...args: S) => T
): (...args: S) => Observable<T> {
  return (...args: S) => {
    try {
      return of(fn(...args));
    } catch (error) {
      return throwError(() => new HttpErrorResponse({ error }));
    }
  };
}