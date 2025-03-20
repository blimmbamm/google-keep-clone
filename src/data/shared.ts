import { HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { DUMMY_NOTES, Note } from './notes';
import { DUMMY_LABELS, Label } from './label';
import { DataChangeSet } from '../app/services/data/data.service';

export enum LocalStorageKeys {
  NOTES = 'notes',
  LABELS = 'labels',
  NAV_MENU_OPEN_STATE = 'nav_menu_open',
  ITEMS = 'items',
}

export enum DataErrorStatus {
  HANDLE_GLOBALLY = 500,
  HANDLE_LOCALLY = 400,
}

export type Item = Note | Label;

export const GLOBAL_ERROR = 'global_error';

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
      const status =
        (error as Error).message === GLOBAL_ERROR
          ? DataErrorStatus.HANDLE_GLOBALLY
          : DataErrorStatus.HANDLE_LOCALLY;
      return throwError(() => new HttpErrorResponse({ error, status }));
    }
  };
}

export function readItems(): Item[] {
  // TODO: this should be Note | Label
  try {
    return JSON.parse(localStorage.getItem(LocalStorageKeys.ITEMS)!);
  } catch {
    throw Error(GLOBAL_ERROR);
  }
}

// TODO: this should be of type Item[], why not working?
export function writeItems(items: any[]) {
  // TODO: this should be Note | Label
  try {
    localStorage.setItem(LocalStorageKeys.ITEMS, JSON.stringify(items));
  } catch {
    throw Error(GLOBAL_ERROR);
  }
}

export function handleChangeSet(changeSet: DataChangeSet) {
  const items = readItems();

  switch (changeSet.type) {
    case 'ADD':
      const newItem = { id: changeSet.id, ...changeSet.payload! };
      writeItems([...items, newItem]);
      break;

    case 'EDIT':
      // Main updating logic is same for note and label:
      const item = items.find((item) => item.id === changeSet.id);
      const updatedItem = { ...item, ...changeSet.payload };

      if (changeSet.entity === 'label') {
        // If label, check all notes and adjust their labels if needed
        items
          .filter((item) => item.entity === 'note')
          .forEach((note) => {
            const label = note.labels?.find(
              (label) => label.id === changeSet.id
            );

            if (label && note.labels) {
              const labelIndex = label && note.labels.indexOf(label);

              note.labels[labelIndex] = updatedItem as Label;
            }
          });
      }

      writeItems([
        ...items.filter((item) => item.id !== changeSet.id),
        updatedItem,
      ]);

      break;

    case 'DELETE':
      if (changeSet.entity === 'label') {
        // if label, also delete them from notes if present
        items
          .filter((item) => item.entity === 'note')
          .forEach((note) => {
            if (note.labels) {
              note.labels = note.labels.filter(
                (label) => label.id !== changeSet.id
              );
            }
          });
      }

      writeItems(items.filter((item) => item.id !== changeSet.id));

      break;

    default:
      break;
  }
}

export function seedItems() {
  writeItems([...DUMMY_NOTES, ...DUMMY_LABELS]);
}
