import { z } from 'zod';
import { Label, LabelSchema } from './label';
import { GLOBAL_ERROR, LocalStorageKeys, toObs } from './shared';

// export interface Note {
//   id: number;
//   title?: string;
//   content?: string;
//   lastModified: Date;
//   trash: boolean;
//   labels?: Label[];
//   backgroundColor?: string;
// }
// export type Note = {
//   id: number;
//   title?: string;
//   content?: string;
//   lastModified: Date;
//   trash: boolean;
//   labels?: Label[];
//   backgroundColor?: string;

// };


const NoteSchema = z.object({
  id: z.number(),
  title: z.optional(z.string()),
  content: z.optional(z.string()),
  lastModified: z.coerce.date(),
  trash: z.boolean(),
  // labels: z.lazy(() => z.optional(z.array(LabelSchema))),
  labels: z.optional(z.array(z.lazy(() => LabelSchema))),
  backgroundColor: z.optional(z.string()),
});

const NoteInputSchema = NoteSchema.pick({
  title: true,
  content: true,
  labels: true,
  trash: true,
  backgroundColor: true,
}).partial();

export type Note = z.infer<typeof NoteSchema>;
export type NoteInput = z.infer<typeof NoteInputSchema>;

// export interface NoteInput {
//   title?: string;
//   content?: string;
//   labels?: Label[];
//   trash?: boolean;
//   backgroundColor?: string;
// }

export const DUMMY_NOTES: Note[] = [
  {
    id: 1,
    title: 'Learn some Angular!',
    lastModified: new Date(),
    trash: false,
    labels: [{ id: 1, name: 'Todos' }],
  },
  {
    id: 2,
    content: `A ball rolls around the corner and falls over.`,
    lastModified: new Date(),
    trash: false,
    labels: [{ id: 2, name: 'Jokes' }],
  },
  {
    id: 3,
    title: 'Shopping list',
    content: `- Bananas <br>
    - Apples`,
    lastModified: new Date(),
    trash: false,
    labels: [{ id: 3, name: 'Lists' }],
  },
  {
    title: 'Trashed note',
    id: 4,
    lastModified: new Date(),
    trash: true,
  },
];

/**
 * Return all notes stored in localStorage.
 */
export function readNotes() {
  try {
    return (
      JSON.parse(localStorage.getItem(LocalStorageKeys.NOTES)!) as Note[]
    ).map((note) => NoteSchema.parse(note));
  } catch {
    throw Error(GLOBAL_ERROR);
  }
}

/**
 * Persist labels in localStorage.
 */
export function saveNotes(notes: Note[]) {
  try {
    localStorage.setItem(LocalStorageKeys.NOTES, JSON.stringify(notes));
  } catch {
    throw Error(GLOBAL_ERROR);
  }
}

/**
 * Save some dummy notes in localStorage. This overwrites any previous data stored
 * with the notes key.
 */
export function seedNotes() {
  saveNotes(DUMMY_NOTES);
}

/**
 * Get all notes from localStorage. Optionally filter by label name or trash flag.
 */
export function getNotesSync(filter: { labelName: string | null; trash: boolean }) {
  const notes = readNotes();

  const { labelName, trash } = filter;

  if (labelName) {
    return notes.filter(
      (note) =>
        note.labels?.map((label) => label.name).includes(labelName) &&
        note.trash === trash
    );
  } else {
    return notes.filter((note) => note.trash === trash);
  }
}

/**
 * Adds a new note to the list of notes.
 */
export function addNoteSync(noteInput: NoteInput) {
  const notes = readNotes();

  const noteId = Date.now();

  const note: Note = {
    ...noteInput,
    id: noteId,
    lastModified: new Date(),
    trash: false,
  };

  saveNotes([note, ...notes]);

  return note;
}

/**
 * Edits the note that has the given id, if exists.
 *
 * This is also used to move notes to or restore from trash.
 */
export function editNoteSync(id: number, noteInput: NoteInput) {
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

    return notes[noteIndex];
  } else {
    throw Error('Note not found.');
  }
}

/**
 * Moves the note to trash by setting the trash flag to true.
 */
export function moveNoteToTrashSync(id: number) {
  editNoteSync(id, { trash: true });
  return true;
}

/**
 * Restores the note from trash by setting the trash flag to false.
 */
export function restoreNoteFromTrashSync(id: number) {
  editNoteSync(id, { trash: false });
  return true;
}

/**
 * Ultimately deletes a note from localStorage.
 */
export function deleteNoteSync(id: number) {
  saveNotes(readNotes().filter((note) => note.id !== id));
  return true;
}

export const getNotes = toObs(getNotesSync);
export const addNote = toObs(addNoteSync);
export const editNote = toObs(editNoteSync);
export const moveNoteToTrash = toObs(moveNoteToTrashSync);
export const restoreNoteFromTrash = toObs(restoreNoteFromTrashSync);
export const deleteNote = toObs(deleteNoteSync);
