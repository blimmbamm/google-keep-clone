import { computed, inject, Injectable, signal } from '@angular/core';
import { Label, LabelInput, readLabels } from '../../../data/label';
import { of } from 'rxjs';
import { toObs } from '../../../data/shared';
import { DataChangeSet, DataService } from '../data/data.service';
import { QueryService } from '../query.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NotesService } from '../notes/notes.service';

@Injectable({
  providedIn: 'root',
})
export class LabelsService {
  private dataService = inject(DataService);
  private queryService = inject(QueryService);
  private notesService = inject(NotesService);

  private _labels = signal<Label[]>([]);

  readonly labels = computed(() =>
    this._labels().sort((labelA, labelB) =>
      labelA.name > labelB.name ? 1 : -1
    )
  );

  labelExists(labelName: string) {
    return this._labels().some((label) => label.name === labelName);
  }

  addLabel(labelInput: LabelInput) {
    if (!labelInput.name) {
      throw Error('Label name cannot be empty.');
    }
    if (this._labels().some((label) => label.name === labelInput.name)) {
      throw Error('A label with that name already exists.');
    }

    const newLabel: Label = {
      id: Date.now(),
      entity: 'label',
      ...labelInput,
    };

    this._labels.update((prevLabels) => [...prevLabels, newLabel]);

    const change: DataChangeSet = {
      entity: 'label',
      type: 'ADD',
      payload: newLabel,
      id: newLabel.id,
      fields: Object.keys(labelInput),
      timestamp: Date.now(),
    };

    this.dataService.change$.next(change);

    return newLabel;
  }

  editLabel(id: number, labelInput: LabelInput) {
    if (!labelInput.name) {
      throw Error('Label name cannot be empty.');
    }

    // check if any other label has the new name:
    if (
      this._labels()
        .filter((label) => label.id !== id)
        .some((label) => label.name === labelInput.name)
    ) {
      throw Error('A label with that name already exists.');
    }

    // Update label in list of labels:
    this._labels.update((prevLabels) => {
      const label = prevLabels.find((label) => label.id === id)!;
      const updatedLabel: Label = {
        ...label,
        ...labelInput,
      };

      return [...prevLabels.filter((label) => label.id !== id), updatedLabel];
    });

    // Update notes if they have the edited label:
    this.notesService._notes.update((prevNotes) => {
      const updatedNotes = [...prevNotes];
      updatedNotes.forEach((note) => {
        const label = note.labels?.find((label) => label.id === id);
        if (label && note.labels) {
          const labelIndex = label && note.labels.indexOf(label);
          note.labels[labelIndex] = { ...label, ...labelInput };
        }
      });
      return updatedNotes;
    });

    const change: DataChangeSet = {
      entity: 'label',
      type: 'EDIT',
      id: id,
      fields: Object.keys(labelInput),
      payload: { ...labelInput },
      timestamp: Date.now(),
    };

    this.dataService.change$.next(change);

    return labelInput;
  }

  deleteLabel(id: number) {
    // Remove label from list of labels:
    this._labels.update((prevLabels) => {
      return prevLabels.filter((label) => label.id !== id);
    });

    // Remove label from notes:
    this.notesService._notes.update((prevNotes) => {
      const updatedNotes = [...prevNotes];
      updatedNotes.forEach((note) => {
        if (note.labels) {
          note.labels = note.labels.filter((label) => label.id !== id);
        }
      });
      return updatedNotes;
    });

    const change: DataChangeSet = {
      entity: 'label',
      type: 'DELETE',
      fields: [],
      timestamp: Date.now(),
      id: id,
    };

    this.dataService.change$.next(change);
  }

  private labelsQuery = this.queryService.useParametrizedQuery({
    paramsObs: of(null),
    httpObsFn: () => toObs(readLabels)(),
    queryKey: () => 'labels',
  });

  constructor() {
    this.labelsQuery.data$
      .pipe(takeUntilDestroyed())
      .subscribe((labels) => labels && this._labels.set(labels));
  }
}
