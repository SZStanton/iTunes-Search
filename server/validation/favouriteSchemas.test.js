import { describe, expect, it } from 'vitest';
import { favouriteSchema } from './favouriteSchemas.js';

function messageFor(value, field) {
  const result = favouriteSchema.safeParse(value);
  if (result.success) return undefined;
  return result.error.issues.find(issue => issue.path[0] === field)?.message;
}

const validFavourite = {
  itemId: 1441164589,
  title: 'Here Comes the Sun',
  artist: 'The Beatles',
  artwork: 'https://example.test/600x600bb.jpg',
  releaseDate: '1969-09-26T07:00:00Z',
  kind: 'song',
};

describe('saving a favourite', () => {
  it('accepts a whole result from a search', () => {
    expect(favouriteSchema.safeParse(validFavourite).success).toBe(true);
  });

  it('needs only an id and a title', () => {
    const result = favouriteSchema.safeParse({
      itemId: 1,
      title: 'Windmills',
    });

    expect(result.success).toBe(true);
    expect(result.data.artist).toBe('');
    expect(result.data.kind).toBe('');
  });

  it('drops anything the client sends that is not a saved field', () => {
    const parsed = favouriteSchema.parse({
      ...validFavourite,
      user: 'someone-elses-id',
      expiresAt: '2020-01-01T00:00:00Z',
      trackPrice: 1.29,
    });

    expect(parsed.user).toBeUndefined();
    expect(parsed.expiresAt).toBeUndefined();
    expect(parsed.trackPrice).toBeUndefined();
  });

  it('takes an id that arrived as a string, since query values often do', () => {
    const parsed = favouriteSchema.parse({
      ...validFavourite,
      itemId: '1441164589',
    });

    expect(parsed.itemId).toBe(1441164589);
  });

  it.each([
    ['missing', undefined, 'An item id is required.'],
    ['a word', 'abc', 'An item id is required.'],
    ['true', true, 'An item id is required.'],
    ['an array holding a number', ['5'], 'An item id is required.'],
    ['an object', {}, 'An item id is required.'],
    ['a fraction', 1.5, 'An item id must be a whole number.'],
    ['zero', 0, 'An item id must be a positive number.'],
    ['negative', -5, 'An item id must be a positive number.'],
  ])('rejects an item id that is %s', (_label, itemId, expected) => {
    expect(messageFor({ ...validFavourite, itemId }, 'itemId')).toBe(expected);
  });

  it.each([
    ['missing', undefined],
    ['empty', ''],
    ['only spaces', '   '],
  ])('rejects a title that is %s', (_label, title) => {
    expect(messageFor({ ...validFavourite, title }, 'title')).toBe(
      'A title is required.',
    );
  });

  it('trims the title rather than storing the spaces', () => {
    const parsed = favouriteSchema.parse({
      ...validFavourite,
      title: '  Here Comes the Sun  ',
    });

    expect(parsed.title).toBe('Here Comes the Sun');
  });

  it('rejects a title longer than the column allows', () => {
    expect(
      messageFor({ ...validFavourite, title: 'a'.repeat(301) }, 'title'),
    ).toBe('Title must be 300 characters or less.');
  });

  it('allows an item with no release date', () => {
    const { releaseDate, ...withoutDate } = validFavourite;

    expect(releaseDate).toBeDefined();
    expect(favouriteSchema.safeParse(withoutDate).success).toBe(true);
  });

  it('rejects a release date that is not a date', () => {
    expect(
      messageFor(
        { ...validFavourite, releaseDate: 'last tuesday' },
        'releaseDate',
      ),
    ).toBe('Release date must be a date.');
  });
});
