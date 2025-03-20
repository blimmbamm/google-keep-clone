import { z } from 'zod';

import { readNotes, saveNotes } from './notes';
import { GLOBAL_ERROR, LocalStorageKeys, readItems } from './shared';

export const LabelSchema = z.object({
  id: z.number(),
  entity: z.literal('label'),
  name: z.string(),
});

export const LabelInputSchema = LabelSchema.omit({ id: true, entity: true });

export type Label = z.infer<typeof LabelSchema>;
export type LabelInput = z.infer<typeof LabelInputSchema>;

export const DUMMY_LABELS: Label[] = [
  { id: 10, entity: 'label', name: 'Todos' },
  { id: 11, entity: 'label', name: 'Jokes' },
  { id: 12, entity: 'label', name: 'Lists' },
];

/**
 * Return all labels stored in localStorage.
 */
export function readLabels() {
  try {
    return readItems()
      .filter((item) => item.entity === 'label')
      .map((label) => LabelSchema.parse(label));
  } catch {
    throw Error(GLOBAL_ERROR);
  }
}

/**
 * ---> ALL THE FOLLOWING IS OLD STUFF! <---
 */

/**
 * Persist labels in localStorage.
 */
export function saveLabels(labels: Label[]) {
  try {
    localStorage.setItem(
      LocalStorageKeys.LABELS,
      JSON.stringify(
        labels.sort((label1, label2) => (label1.name < label2.name ? -1 : 1))
      )
    );
  } catch {
    throw Error(GLOBAL_ERROR);
  }
}

export function labelExists(labelName: string) {
  const labels = readLabels();
  return labels.some((label) => label.name === labelName);
}

/**
 * Returns all labels stored in localStorage.
 */
export function getLabelsSync() {
  return readLabels();
}

/**
 * Get single label by its name
 */
export function getLabelByNameSync(labelName: string) {
  const label = readLabels().find((label) => label.name === labelName);
  if (label) {
    return label;
  } else {
    throw Error('No label with such name.');
  }
}

/**
 * Adds new label if none with exists with same name, else throw error.
 *
 * Also throw error if provided name is empty.
 */
export function addLabelSync(labelInput: LabelInput) {
  if (!labelInput.name) {
    throw Error('Label name cannot be empty.');
  }

  const labels = readLabels();

  if (labels.find((label) => label.name === labelInput.name)) {
    throw Error('A label with that name already exists.');
  } else {
    const newLabel: Label = { id: Date.now(), entity: 'label', ...labelInput };
    saveLabels([...labels, newLabel]);
    return newLabel;
  }
}

/**
 * Edits the fields for the label with submitted id, if exists. Else nothing happens.
 */
export function editLabelSync(id: number, labelInput: LabelInput) {
  if (!labelInput.name) {
    throw Error('Label name cannot be empty.');
  }

  const labels = readLabels();

  // check if any other label has the new name:
  if (
    labels
      .filter((label) => label.id !== id)
      .some((label) => label.name === labelInput.name)
  ) {
    throw Error('A label with that name already exists.');
  }

  const label = labels.find((label) => label.id === id);

  if (label) {
    const labelIndex = labels.indexOf(label);

    labels[labelIndex] = {
      ...label,
      ...labelInput,
    };

    saveLabels(labels);

    // Update notes
    const notes = readNotes();

    notes.forEach((note) => {
      const label = note.labels?.find((label) => label.id === id);

      if (label && note.labels) {
        const labelIndex = label && note.labels.indexOf(label);

        note.labels[labelIndex] = {
          ...label,
          ...labelInput,
        };
      }
    });

    saveNotes(notes);
  }

  return true;
}

/**
 * Deletes a label by id. As a consequence, the label is also
 * removed from every note's list of labels.
 */
export function deleteLabelSync(id: number) {
  const labels = readLabels();

  saveLabels(labels.filter((label) => label.id !== id));

  const notes = readNotes();

  notes.forEach((note) => {
    if (note.labels) {
      note.labels = note.labels.filter((label) => label.id !== id);
    }
  });

  saveNotes(notes);

  return true;
}

// export const getLabels = toObs(getLabelsSync);
// export const getLabelByName = toObs(getLabelByNameSync);
// export const addLabel = toObs(addLabelSync);
// export const editLabel = toObs(editLabelSync);
// export const deleteLabel = toObs(deleteLabelSync);

export default {
  labelExists,
  // getLabels,
  // getLabelByName,
  // addLabel,
  // editLabel,
  // deleteLabel,
};
