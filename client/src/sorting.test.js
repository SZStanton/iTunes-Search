import { describe, expect, it } from 'vitest';
import { orderLabel, sortResults } from './sorting';

const results = [
  {
    trackName: 'Come Together',
    artistName: 'The Beatles',
    releaseDate: '1969-09-26T07:00:00Z',
  },
  {
    trackName: 'Aubade',
    artistName: 'Zara Quinn',
    releaseDate: '2024-03-01T07:00:00Z',
  },
  {
    trackName: 'blackbird',
    artistName: 'alex carter',
    releaseDate: '1968-11-22T07:00:00Z',
  },
];

function titles(sorted) {
  return sorted.map(item => item.trackName);
}

describe('sorting the results', () => {
  it('leaves the order the api sent alone under relevance', () => {
    expect(sortResults(results, 'relevance')).toBe(results);
  });

  it('turns that order around when reversed', () => {
    expect(titles(sortResults(results, 'relevance', true))).toEqual([
      'blackbird',
      'Aubade',
      'Come Together',
    ]);
  });

  it('never rewrites the array it was handed', () => {
    const before = titles(results);
    sortResults(results, 'title');

    expect(titles(results)).toEqual(before);
  });

  it('puts the newest first by date, oldest first reversed', () => {
    expect(titles(sortResults(results, 'released'))).toEqual([
      'Aubade',
      'Come Together',
      'blackbird',
    ]);
    expect(titles(sortResults(results, 'released', true))).toEqual([
      'blackbird',
      'Come Together',
      'Aubade',
    ]);
  });

  it('sorts titles without caring about case', () => {
    // A plain sort puts every capital ahead of every lowercase, so blackbird
    // would land after Come Together
    expect(titles(sortResults(results, 'title'))).toEqual([
      'Aubade',
      'blackbird',
      'Come Together',
    ]);
  });

  it('sorts by artist', () => {
    expect(titles(sortResults(results, 'artist'))).toEqual([
      'blackbird',
      'Come Together',
      'Aubade',
    ]);
  });

  it('separates two records from the same year by month and day', () => {
    // The card only ever shows the year, so without this they would look
    // interchangeable and sit in whatever order the api sent
    const sameYear = [
      { trackName: 'March', releaseDate: '1969-03-04T07:00:00Z' },
      { trackName: 'November', releaseDate: '1969-11-02T07:00:00Z' },
      { trackName: 'March the fifth', releaseDate: '1969-03-05T07:00:00Z' },
    ];

    expect(titles(sortResults(sameYear, 'released'))).toEqual([
      'November',
      'March the fifth',
      'March',
    ]);
    expect(titles(sortResults(sameYear, 'released', true))).toEqual([
      'March',
      'March the fifth',
      'November',
    ]);
  });

  it('keeps results with nothing to sort on at the bottom either way', () => {
    const withGaps = [...results, { trackName: 'Undated' }];

    expect(titles(sortResults(withGaps, 'released')).at(-1)).toBe('Undated');
    expect(titles(sortResults(withGaps, 'released', true)).at(-1)).toBe(
      'Undated',
    );
  });

  it('falls back to the collection name when there is no track', () => {
    // Sorted on Abbey Road rather than treated as having no title at all,
    // which would drop it to the bottom
    const album = [{ trackName: 'Zephyr' }, { collectionName: 'Abbey Road' }];

    expect(sortResults(album, 'title')[0].collectionName).toBe('Abbey Road');
  });

  it('names the direction in terms of the field', () => {
    expect(orderLabel('released', false)).toBe('Newest');
    expect(orderLabel('released', true)).toBe('Oldest');
    expect(orderLabel('title', false)).toBe('A to Z');
    expect(orderLabel('artist', true)).toBe('Z to A');
  });
});
