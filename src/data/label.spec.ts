import LabelApi, {
  addLabelSync,
  deleteLabelSync,
  DUMMY_LABELS,
  editLabelSync,
  getLabelByNameSync,
  getLabelsSync,
  readLabels,
  saveLabels,
  seedLabels,
} from './label';
import { GLOBAL_ERROR, LocalStorageKeys } from './shared';
import { readNotes, seedNotes } from './notes';

describe('LabelApi', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  describe('readLabels', () => {
    it('should read labels from localStorage', () => {
      seedLabels();
      const result = readLabels();
      expect(result).toEqual(DUMMY_LABELS);
    });

    it('should throw an error if localStorage data is invalid json', () => {
      localStorage.setItem(LocalStorageKeys.LABELS, 'invalid json');
      expect(readLabels).toThrowError(GLOBAL_ERROR);
    });

    it('should throw an error if localStorage data is valid json but not array of labels', () => {
      localStorage.setItem(
        LocalStorageKeys.LABELS,
        JSON.stringify([
          { id: 1, something: 'else' },
          { id: 2, name: 'label' },
        ])
      );
      expect(readLabels).toThrowError(GLOBAL_ERROR);
    });
  });

  describe('labelExists', () => {
    it('should return true if label exists', () => {
      localStorage.setItem(
        LocalStorageKeys.LABELS,
        JSON.stringify(DUMMY_LABELS)
      );
      const result = LabelApi.labelExists('Todos');
      expect(result).toBeTrue();
    });

    it('should return false if label does not exist', () => {
      localStorage.setItem(
        LocalStorageKeys.LABELS,
        JSON.stringify(DUMMY_LABELS)
      );
      const result = LabelApi.labelExists('NonExistentLabel');
      expect(result).toBeFalse();
    });
  });

  describe('seedLabels', () => {
    it('should overwrite existing labels with dummy labels', () => {
      seedLabels();
      const result = readLabels();
      expect(result).toEqual(DUMMY_LABELS);
    });
  });

  describe('saveLabels', () => {
    it('should persist labels in localStorage', () => {
      saveLabels(DUMMY_LABELS);
      const labels = readLabels();
      expect(labels).toEqual(DUMMY_LABELS);
    });

    it('should throw an error if saving to localStorage fails', () => {
      spyOn(localStorage, 'setItem').and.throwError(GLOBAL_ERROR);
      expect(() => saveLabels(DUMMY_LABELS)).toThrowError(GLOBAL_ERROR);
    });
  });

  describe('getLabelsSync', () => {
    it('should return all labels stored in localStorage', () => {
      seedLabels();
      const result = getLabelsSync();
      expect(result).toEqual(DUMMY_LABELS);
    });
  });

  describe('getLabelByNameSync', () => {
    it('should return the label with the specified name', () => {
      seedLabels();
      const result = getLabelByNameSync('Todos');
      expect(result).toEqual({ id: 1, name: 'Todos' });
    });

    it('should throw an error if the label does not exist', () => {
      seedLabels();
      expect(() => getLabelByNameSync('NonExistentLabel')).toThrowError(
        'No label with such name.'
      );
    });
  });

  describe('addLabelSync', () => {
    it('should add a new label if none with the same name exists', () => {
      seedLabels();
      const newLabel = { name: 'NewLabel' };
      const result = addLabelSync(newLabel);
      const labels = readLabels();
      expect(labels).toContain(result);
    });

    it('should throw an error if a label with the same name already exists', () => {
      seedLabels();
      const newLabel = { name: 'Todos' };
      expect(() => addLabelSync(newLabel)).toThrowError(
        'A label with that name already exists.'
      );
    });

    it('should throw an error if the label name is empty', () => {
      const newLabel = { name: '' };
      expect(() => addLabelSync(newLabel)).toThrowError(
        'Label name cannot be empty.'
      );
    });
  });

  describe('editLabelSync', () => {
    it('should edit the label with the specified id', () => {
      seedLabels();
      seedNotes();

      const updatedLabel = { name: 'UpdatedLabel' };
      editLabelSync(1, updatedLabel);

      const labels = readLabels();
      expect(labels.find((label) => label.id === 1)?.name).toEqual(
        'UpdatedLabel'
      );

      const notes = readNotes();
      expect(notes[0].labels![0].name).toEqual(updatedLabel.name);
    });

    it('should throw an error if the label name is empty', () => {
      const updatedLabel = { name: '' };
      expect(() => editLabelSync(1, updatedLabel)).toThrowError(
        'Label name cannot be empty.'
      );
    });

    it('should throw an error if another label with the same name exists', () => {
      seedLabels();
      const updatedLabel = { name: 'Jokes' };
      expect(() => editLabelSync(1, updatedLabel)).toThrowError(
        'A label with that name already exists.'
      );
    });
  });

  describe('deleteLabelSync', () => {
    it('should delete the label with the specified id', () => {
      seedLabels();
      seedNotes();

      deleteLabelSync(1);
      const labels = readLabels();
      expect(labels.find((label) => label.id === 1)).toBeUndefined();

      const notes = readNotes();
      expect(notes[0].labels!).toEqual([]);
    });
  });
});
