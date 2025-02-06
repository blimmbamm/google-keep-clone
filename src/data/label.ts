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
 */
function addLabelSync(labelInput: LabelInput) {
  const labels = readLabels();

  if (labels.find((label) => label.name === labelInput.name)) {
    throw Error('A label with that name already exists.');
  } else {
    const newLabel = { id: Date.now(), ...labelInput };
    saveLabels([...labels, newLabel]);
  }
}

/**
 * Edits the fields for the label with submitted id, if exists. Else nothing happens.
 */
function editLabelSync(id: number, labelInput: LabelInput) {
  const labels = readLabels();
  const label = labels.find((label) => label.id === id);
  if (label) {
    const updatedLabels = [
      ...labels.filter((label) => label.id !== id),
      { ...label, ...labelInput },
    ];

    saveLabels(updatedLabels);
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
