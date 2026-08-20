// The dropdown, the chips and the query all read this one list, so a type
// cannot exist in the interface without a filter behind it. Album is a media
// plus an entity, which is why these are objects rather than strings.
// 'movie' and 'shortFilm' are deliberately absent, Apple returns nothing for
// either in any storefront
const MEDIA_TYPES = [
  { value: 'all', label: 'All', filter: {} },
  { value: 'podcast', label: 'Podcast', filter: { media: 'podcast' } },
  { value: 'music', label: 'Music', filter: { media: 'music' } },
  {
    value: 'album',
    label: 'Album',
    filter: { media: 'music', entity: 'album' },
  },
  {
    value: 'music video',
    label: 'Music Video',
    filter: { media: 'musicVideo' },
  },
  { value: 'audiobook', label: 'Audiobook', filter: { media: 'audiobook' } },
  { value: 'tv show', label: 'TV Show', filter: { media: 'tvShow' } },
  { value: 'software', label: 'Software', filter: { media: 'software' } },
  { value: 'ebook', label: 'Ebook', filter: { media: 'ebook' } },
];

function mediaFilter(value) {
  return MEDIA_TYPES.find(type => type.value === value)?.filter ?? {};
}

// What the API calls a result, in words. Anything unrecognised gets nothing
// rather than a raw slug like 'tv-episode' on the front of a card
const KIND_LABELS = {
  song: 'Music',
  album: 'Album',
  podcast: 'Podcast',
  'podcast-episode': 'Podcast',
  ebook: 'Ebook',
  software: 'App',
  audiobook: 'Audiobook',
  'tv-episode': 'TV',
  'music-video': 'Music video',
  'feature-movie': 'Film',
};

// A date-only value is stored as UTC midnight, so reading the year in local
// time puts anyone west of UTC in the year before
function releaseYear(releaseDate) {
  if (!releaseDate) return '';

  const year = new Date(releaseDate).getUTCFullYear();

  return Number.isNaN(year) ? '' : String(year);
}

// 'MUSIC · 2024', or whichever half of it exists
function resultLabel(item) {
  return [KIND_LABELS[item.kind], releaseYear(item.releaseDate)]
    .filter(Boolean)
    .join(' · ');
}

export { MEDIA_TYPES, mediaFilter, releaseYear, resultLabel };
