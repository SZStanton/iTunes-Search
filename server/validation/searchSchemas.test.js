import { describe, expect, it } from 'vitest';
import { MEDIA_LABELS, historySchema } from './searchSchemas.js';

function messageFor(value, field) {
  const result = historySchema.safeParse(value);
  if (result.success) return undefined;
  return result.error.issues.find(issue => issue.path[0] === field)?.message;
}

describe('remembering a search', () => {
  it('accepts a term and a media filter', () => {
    expect(
      historySchema.safeParse({ term: 'beatles', media: 'music' }).success,
    ).toBe(true);
  });

  it('defaults to all when no filter is given', () => {
    expect(historySchema.parse({ term: 'beatles' }).media).toBe('all');
  });

  it('trims the term, so the same search is not stored twice', () => {
    expect(historySchema.parse({ term: '  beatles  ' }).term).toBe('beatles');
  });

  it.each([
    ['missing', undefined],
    ['empty', ''],
    ['only spaces', '   '],
  ])('rejects a term that is %s', (_label, term) => {
    expect(messageFor({ term, media: 'music' }, 'term')).toBe(
      'A search term is required.',
    );
  });

  it('rejects a term longer than the box would ever send', () => {
    expect(messageFor({ term: 'a'.repeat(121) }, 'term')).toBe(
      'Search term must be 120 characters or less.',
    );
  });

  it.each(MEDIA_LABELS)('accepts the %s filter', label => {
    expect(
      historySchema.safeParse({ term: 'beatles', media: label }).success,
    ).toBe(true);
  });

  it.each(['movie', 'short film', 'musicArtist', 'anything'])(
    'rejects %s, which the dropdown does not offer',
    media => {
      expect(messageFor({ term: 'beatles', media }, 'media')).toBe(
        'That is not one of the media filters.',
      );
    },
  );
});
