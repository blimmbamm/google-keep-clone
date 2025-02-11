import { Label } from './label';
import { LocalStorageKeys, toObs } from './shared';

export interface Note {
  id: number;
  title?: string;
  content?: string;
  lastModified: Date;
  trash: boolean;
  labels?: Label[];
  backgroundColor?: string;
}

export interface NoteInput {
  title?: string;
  content?: string;
  labels?: Label[];
  trash?: boolean;
  backgroundColor?: string;
}

/**
 * Return all notes stored in localStorage.
 */
export function readNotes() {
  return JSON.parse(localStorage.getItem(LocalStorageKeys.NOTES)!) as Note[];
}

/**
 * Persist labels in localStorage.
 */
export function saveNotes(notes: Note[]) {
  localStorage.setItem(LocalStorageKeys.NOTES, JSON.stringify(notes));
}

/**
 * Save some dummy notes in localStorage. This overwrites any previous data stored
 * with the notes key.
 */
export function seedNotes() {
  const DUMMY_NOTES: Note[] = [
    {
      id: 1,
      title: 'Hello',
      content: 'World',
      lastModified: new Date(),
      trash: false,
      labels: [{ id: 1, name: 'Dingens' }],
    },
    {
      id: 2,
      title: 'Another note',
      content: `With some dummy content that spreads across multiple lines. This doesn't work yet.`,
      lastModified: new Date(),
      trash: false,
      labels: [{ id: 2, name: 'Dongens' }],
    },
    {
      id: 3,
      title: 'Another note',
      content: `That should only appear in trash.`,
      lastModified: new Date(),
      trash: true,
      labels: [{ id: 2, name: 'Dongens' }],
    },
    {
      id: 4,
      lastModified: new Date(),
      trash: false,
      labels: [],
    },
  ];

  saveNotes(DUMMY_NOTES);
}

/**
 * Get all notes from localStorage. Optionally filter by label name or trash flag.
 */
function getNotesSync(labelName?: string, trash?: boolean) {
  const notes = readNotes();

  if (labelName) {
    return notes.filter(
      (note) =>
        note.labels?.map((label) => label.name).includes(labelName) &&
        !note.trash
    );
  } else if (trash) {
    return notes.filter((note) => note.trash);
  } else {
    return notes;
  }
}

/**
 * Adds a new note to the list of notes.
 */
function addNoteSync(noteInput: NoteInput) {
  const notes = readNotes();

  const noteId = Date.now();

  const note: Note = {
    ...noteInput,
    id: noteId,
    lastModified: new Date(),
    trash: false,
  };

  saveNotes([...notes, note]);

  return noteId
}

/**
 * Edits the note that has the given id, if exists.
 *
 * This is also used to move notes to or restore from trash.
 */
function editNoteSync(id: number, noteInput: NoteInput) {
  const notes = readNotes();

  const note = notes.find((note) => note.id === id);

  if (note) {
    const noteIndex = notes.indexOf(note);

    notes[noteIndex] = {
      ...note,
      ...noteInput,
      lastModified: new Date(),
    };

    saveNotes(notes);
  } else {
    throw Error('Note not found.');
  }
}

/**
 * Moves the note to trash by setting the trash flag to true.
 */
function moveNoteToTrashSync(id: number) {
  editNoteSync(id, { trash: true });
}

/**
 * Restores the note from trash by setting the trash flag to false.
 */
function restoreNoteFromTrashSync(id: number) {
  editNoteSync(id, { trash: false });
}

/**
 * Ultimately deletes a note from localStorage.
 */
function deleteNoteSync(id: number) {
  saveNotes(readNotes().filter((note) => note.id !== id));
}

export const getNotes = toObs(getNotesSync);
export const addNote = toObs(addNoteSync);
export const editNote = toObs(editNoteSync);
export const moveNoteToTrash = toObs(moveNoteToTrashSync);
export const restoreNoteFromTrash = toObs(restoreNoteFromTrashSync);
export const deleteNote = toObs(deleteNoteSync);
