import { inject, Injectable } from '@angular/core';
import { buffer, debounceTime, Subject } from 'rxjs';
import {
  handleChangeSet,
  LocalStorageKeys,
  seedItems,
  toObs,
} from '../../../data/shared';
import { desc, from } from 'arquero';
import { QueryService } from '../query.service';
import { Note, NoteInput } from '../../../data/notes';
import { Label, LabelInput } from '../../../data/label';

export interface DataChangeSet {
  type: 'ADD' | 'EDIT' | 'DELETE';
  entity: 'note' | 'label';
  id: number;
  fields: Array<keyof Note | keyof Label | string>;
  payload?: Note | NoteInput | Label | LabelInput;
  timestamp: number;
}

/**
 * All changes that are emitted by notes or labels service are bundled and
 * send to a fake backend here. The service implements a buffering such that
 * requests are not send for each change but in bundled fashion.
 */
@Injectable({
  providedIn: 'root',
})
export class DataService {
  private queryService = inject(QueryService);

  readonly change$ = new Subject<DataChangeSet>();

  // Only push changes to backend if no new changes occur within 500ms
  private bufferEnd$ = this.change$.pipe(debounceTime(500));

  private changesMutation = this.queryService.useMutation({
    httpObsFn: (changes: DataChangeSet[]) => submitChanges(changes),
    onError: () => {},
    onSuccess: () => {},
  });

  __ = this.change$
    .pipe(buffer(this.bufferEnd$))
    .subscribe((bufferedChanges) => {
      // Sort by timestamp to ensure correct order of execution
      // Plus: Aggregate changes, i.e. remove redundant/keep last changes
      const changes = from(bufferedChanges)
        .orderby(desc('timestamp'))
        .dedupe(['id', 'entity', 'type', 'fields'])
        .orderby('timestamp')
        .objects() as DataChangeSet[];

      // Array of changes would be send to backend at this point
      this.changesMutation.mutate(changes);
    });

  constructor() {
    // If there is no items key set in localStorage, seed with dummy items:
    try {
      !localStorage.getItem(LocalStorageKeys.ITEMS) && seedItems();
    } catch {
      this.queryService.emitWriteToLocalStorageError();
    }
  }
}

function submitChangesSync(changes: DataChangeSet[]) {
  changes.forEach((change) => handleChangeSet(change));
  return true;
}

const submitChanges = toObs(submitChangesSync);

// const DUMMY_CHANGES = [
//   {
//     id: 1,
//     entity: 'note',
//     timestamp: 1,
//     type: 'ADD',
//     fields: ['title'],
//     payload: {
//       id: 1,
//       entity: 'note',
//       lastModified: new Date(),
//       title: 'H',
//       trash: false,
//     },
//   },
//   {
//     id: 1,
//     entity: 'note',
//     timestamp: 2,
//     type: 'EDIT',
//     fields: ['title'],
//     payload: { lastModified: new Date(), title: 'He' },
//   },
//   {
//     id: 1,
//     entity: 'note',
//     timestamp: 3,
//     type: 'EDIT',
//     fields: ['title'],
//     payload: { lastModified: new Date(), title: 'Hel' },
//   },
//   {
//     id: 1,
//     entity: 'note',
//     timestamp: 4,
//     type: 'EDIT',
//     fields: ['title'],
//     payload: { lastModified: new Date(), title: 'Hell' },
//   },
//   {
//     id: 1,
//     entity: 'note',
//     timestamp: 5,
//     type: 'EDIT',
//     fields: ['title'],
//     payload: { lastModified: new Date(), title: 'Hello' },
//   },
//   {
//     id: 1,
//     entity: 'note',
//     timestamp: 6,
//     type: 'EDIT',
//     fields: ['backgroundColor'],
//     payload: { lastModified: new Date(), backgroundColor: '#123456' },
//   },
//   {
//     id: 2,
//     entity: 'label',
//     timestamp: 7,
//     type: 'ADD',
//     fields: ['name'],
//     payload: { id: 1, entity: 'label', name: 'Some label' },
//   },
// ];
