import { readNotes, saveNotes } from './notes';
import { LocalStorageKeys, toObs } from './shared';

export interface Label {
  id: number;
  name: string;
}

export interface LabelInput {
  name: string;
}

/**
 * Overwrites any existing labels with some dummy labels
 */
export function seedLabels() {
  saveLabels([
    { id: 1, name: 'Dingens' },
    { id: 2, name: 'Dongens' },
    { id: 3, name: 'Banane' },
  ]);
}

/**
 * Return all labels stored in localStorage.
 */
function readLabels() {
  return JSON.parse(localStorage.getItem(LocalStorageKeys.LABELS)!) as Label[];
}

/**
 * Persist labels in localStorage.
 */
function saveLabels(labels: Label[]) {
  localStorage.setItem(LocalStorageKeys.LABELS, JSON.stringify(labels));
}

/**
 * Returns all labels stored in localStorage.
 */
function getLabelsSync() {
  return readLabels();
}

/**
 * Adds new label if none with exists with same name, else throw error.
 * 
 * Also throw error if provided name is empty.
 */
function addLabelSync(labelInput: LabelInput) {
  if (!labelInput.name) {
    throw Error('Label name cannot be empty.');
  }

  const labels = readLabels();

  if (labels.find((label) => label.name === labelInput.name)) {
    throw Error('A label with that name already exists.');
  } else {
    const newLabel: Label = { id: Date.now(), ...labelInput };
    saveLabels([...labels, newLabel]);
    return newLabel;
  }
}

/**
 * Edits the fields for the label with submitted id, if exists. Else nothing happens.
 */
function editLabelSync(id: number, labelInput: LabelInput) {
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

    notes.forEach(note => {

      const label = note.labels?.find(label => label.id === id)
      
      if(label && note.labels) {
        const labelIndex = label && note.labels.indexOf(label);
        
        note.labels[labelIndex] = {
          ...label,
          ...labelInput
        }
      }
    });

    saveNotes(notes);
  }


}

/**
 * Deletes a label by id. As a consequence, the label is also
 * removed from every note's list of labels.
 */
function deleteLabelSync(id: number) {
  const labels = readLabels();

  saveLabels(labels.filter((label) => label.id !== id));

  const notes = readNotes();

  notes.forEach((note) => {
    if (note.labels) {
      note.labels = note.labels.filter((label) => label.id !== id);
    }
  });

  saveNotes(notes);
}

export const getLabels = toObs(getLabelsSync);
export const addLabel = toObs(addLabelSync);
export const editLabel = toObs(editLabelSync);
export const deleteLabel = toObs(deleteLabelSync);
