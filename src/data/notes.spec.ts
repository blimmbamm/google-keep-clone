import {
  DUMMY_NOTES,
  readNotes,
  saveNotes,
  seedNotes,
  getNotesSync,
  addNoteSync,
  editNoteSync,
  moveNoteToTrashSync,
  restoreNoteFromTrashSync,
  deleteNoteSync,
} from './notes';
import { GLOBAL_ERROR, LocalStorageKeys } from './shared';

describe('NotesApi', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  describe('readNotes', () => {
    it('should read notes from localStorage', () => {
      seedNotes();
      const result = readNotes();
      expect(result).toEqual(DUMMY_NOTES);
    });

    it('should throw an error if localStorage data is invalid', () => {
      localStorage.setItem(LocalStorageKeys.NOTES, 'invalid json');
      expect(() => readNotes()).toThrowError(GLOBAL_ERROR);
    });

    it('should throw an error if localStorage data is valid json but not an array of notes', () => {
      localStorage.setItem(
        LocalStorageKeys.NOTES,
        JSON.stringify([{ some: 'thing', else: 'still' }])
      );
      expect(() => readNotes()).toThrowError(GLOBAL_ERROR);
    });
  });

  describe('saveNotes', () => {
    it('should persist notes in localStorage', () => {
      saveNotes(DUMMY_NOTES);
      const result = readNotes();
      expect(result).toEqual(DUMMY_NOTES);
    });

    it('should throw an error if saving to localStorage fails', () => {
      spyOn(localStorage, 'setItem').and.throwError(GLOBAL_ERROR);
      expect(() => saveNotes(DUMMY_NOTES)).toThrowError(GLOBAL_ERROR);
    });
  });

  describe('seedNotes', () => {
    it('should overwrite existing notes with dummy notes', () => {
      seedNotes();
      const result = readNotes();
      expect(result).toEqual(DUMMY_NOTES);
    });
  });

  describe('getNotesSync', () => {
    it('should return all notes stored in localStorage', () => {
      seedNotes();
      const result = getNotesSync({ labelName: null, trash: false });
      expect(result).toEqual(DUMMY_NOTES.filter((note) => !note.trash));
    });

    it('should filter notes by label name', () => {
      seedNotes();
      const result = getNotesSync({ labelName: 'Todos', trash: false });
      expect(result).toEqual(
        DUMMY_NOTES.filter(
          (note) =>
            note.labels?.some((label) => label.name === 'Todos') && !note.trash
        )
      );
    });

    it('should filter notes by trash flag', () => {
      seedNotes();
      const result = getNotesSync({ labelName: null, trash: true });
      expect(result).toEqual(DUMMY_NOTES.filter((note) => note.trash));
    });
  });

  describe('addNoteSync', () => {
    it('should add a new note to the list of notes', () => {
      seedNotes();
      const newNote = { title: 'New Note', content: 'Content' };
      const result = addNoteSync(newNote);
      const notes = readNotes();
      expect(notes).toContain(result);
    });
  });

  describe('editNoteSync', () => {
    it('should edit the note with the specified id', () => {
      seedNotes();
      const updatedNote = { title: 'Updated Note' };
      const result = editNoteSync(1, updatedNote);
      const notes = readNotes();
      expect(notes.find((note) => note.id === 1)?.title).toEqual(
        'Updated Note'
      );
    });

    it('should throw an error if the note does not exist', () => {
      seedNotes();
      const updatedNote = { title: 'Updated Note' };
      expect(() => editNoteSync(999, updatedNote)).toThrowError(
        'Note not found.'
      );
    });
  });

  describe('moveNoteToTrashSync', () => {
    it('should move the note to trash by setting the trash flag to true', () => {
      seedNotes();
      moveNoteToTrashSync(1);
      const notes = readNotes();
      expect(notes.find((note) => note.id === 1)?.trash).toBeTrue();
    });
  });

  describe('restoreNoteFromTrashSync', () => {
    it('should restore the note from trash by setting the trash flag to false', () => {
      seedNotes();
      restoreNoteFromTrashSync(4);
      const notes = readNotes();
      expect(notes.find((note) => note.id === 4)?.trash).toBeFalse();
    });
  });

  describe('deleteNoteSync', () => {
    it('should delete the note with the specified id', () => {
      seedNotes();
      deleteNoteSync(1);
      const notes = readNotes();
      expect(notes.find((note) => note.id === 1)).toBeUndefined();
    });
  });
});
