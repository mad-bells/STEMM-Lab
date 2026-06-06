/**
 * firebase.test.js
 * Unit tests for Firestore field conversion helpers: toFields / fromFields.
 * These functions are the core serialisation layer between JS objects and
 * the Firestore REST API wire format.
 */

jest.mock('expo-file-system/legacy', () => ({}));
jest.mock('expo-constants', () => ({
  expoConfig: {
    extra: {
      firebaseProjectId: 'test-project',
      firebaseStorageBucket: 'test-project.appspot.com',
    },
  },
}));

import { toFields, fromFields } from '../src/services/firebase';

// ── toFields ──────────────────────────────────────────────────────────────

describe('toFields', () => {
  it('converts string values', () => {
    expect(toFields({ name: 'Alice' })).toEqual({
      name: { stringValue: 'Alice' },
    });
  });

  it('converts number values as doubleValue', () => {
    expect(toFields({ score: 42 })).toEqual({
      score: { doubleValue: 42 },
    });
  });

  it('converts boolean values', () => {
    expect(toFields({ active: true })).toEqual({
      active: { booleanValue: true },
    });
  });

  it('converts string arrays', () => {
    expect(toFields({ members: ['Alice', 'Bob'] })).toEqual({
      members: {
        arrayValue: {
          values: [{ stringValue: 'Alice' }, { stringValue: 'Bob' }],
        },
      },
    });
  });

  it('skips null and undefined values', () => {
    const result = toFields({ name: 'Alice', score: null, grade: undefined });
    expect(result).not.toHaveProperty('score');
    expect(result).not.toHaveProperty('grade');
    expect(result).toHaveProperty('name');
  });

  it('filters null items from arrays', () => {
    const result = toFields({ items: ['a', null, 'b'] });
    expect(result.items.arrayValue.values).toHaveLength(2);
  });

  it('handles empty object', () => {
    expect(toFields({})).toEqual({});
  });

  it('converts a full team profile', () => {
    const profile = { teamName: 'Rockets', grade: 'Year 7', members: ['Ali', 'Sam'], discriminator: 'ABC123' };
    const fields = toFields(profile);
    expect(fields.teamName).toEqual({ stringValue: 'Rockets' });
    expect(fields.grade).toEqual({ stringValue: 'Year 7' });
    expect(fields.members.arrayValue.values).toHaveLength(2);
    expect(fields.discriminator).toEqual({ stringValue: 'ABC123' });
  });
});

// ── fromFields ────────────────────────────────────────────────────────────

describe('fromFields', () => {
  it('converts stringValue', () => {
    expect(fromFields({ name: { stringValue: 'Alice' } })).toEqual({ name: 'Alice' });
  });

  it('converts doubleValue', () => {
    expect(fromFields({ score: { doubleValue: 42 } })).toEqual({ score: 42 });
  });

  it('converts integerValue as number', () => {
    expect(fromFields({ count: { integerValue: '7' } })).toEqual({ count: 7 });
  });

  it('converts booleanValue', () => {
    expect(fromFields({ active: { booleanValue: false } })).toEqual({ active: false });
  });

  it('converts arrayValue of strings', () => {
    const fields = {
      members: {
        arrayValue: {
          values: [{ stringValue: 'Alice' }, { stringValue: 'Bob' }],
        },
      },
    };
    expect(fromFields(fields)).toEqual({ members: ['Alice', 'Bob'] });
  });

  it('converts empty arrayValue to empty array', () => {
    const fields = { items: { arrayValue: {} } };
    expect(fromFields(fields)).toEqual({ items: [] });
  });

  it('handles null/undefined fields arg gracefully', () => {
    expect(fromFields(null)).toEqual({});
    expect(fromFields(undefined)).toEqual({});
  });

  it('round-trips a team profile through toFields then fromFields', () => {
    const original = {
      teamName: 'Rockets',
      grade: 'Year 7',
      members: ['Ali', 'Sam'],
      discriminator: 'ABC123',
    };
    const roundTripped = fromFields(toFields(original));
    expect(roundTripped.teamName).toBe('Rockets');
    expect(roundTripped.grade).toBe('Year 7');
    expect(roundTripped.members).toEqual(['Ali', 'Sam']);
    expect(roundTripped.discriminator).toBe('ABC123');
  });
});
