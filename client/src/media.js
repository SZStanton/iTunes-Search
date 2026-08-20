// The dropdown, the chips and the query read this one list, so a type cannot
// exist in the interface without a filter behind it. No movie or shortFilm
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

// Unrecognised gets nothing rather than a raw slug like 'tv-episode'
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

// A date-only value is UTC midnight, so a local year puts anyone west of UTC
// a year early
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
