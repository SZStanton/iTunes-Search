// Unreversed is newest first for a date, A to Z for a name
const SORT_FIELDS = [
  { value: 'relevance', label: 'Relevance', order: ['Best match', 'Reversed'] },
  { value: 'released', label: 'Release date', order: ['Newest', 'Oldest'] },
  { value: 'title', label: 'Title', order: ['A to Z', 'Z to A'] },
  { value: 'artist', label: 'Artist', order: ['A to Z', 'Z to A'] },
];

const readers = {
  released: item => item.releaseDate ?? '',
  title: item => item.trackName ?? item.collectionName ?? '',
  artist: item => item.artistName ?? '',
};

// ISO timestamps, so text order is date order down to the day, and only the
// year is ever shown
function compareDates(left, right) {
  if (left === right) return 0;

  // Newest first, so this pair is the other way round
  return left > right ? -1 : 1;
}

function orderLabel(field, reversed) {
  const found = SORT_FIELDS.find(sort => sort.value === field);

  return found ? found.order[reversed ? 1 : 0] : '';
}

function fieldLabel(field) {
  return SORT_FIELDS.find(sort => sort.value === field)?.label ?? '';
}

function sortResults(results, field, reversed = false) {
  if (field === 'relevance') {
    return reversed ? [...results].reverse() : results;
  }

  const read = readers[field];
  if (!read) return results;

  return [...results].sort((a, b) => {
    const left = read(a);
    const right = read(b);

    // Blanks stay at the bottom either way round, not at the top reversed
    if (!left || !right) {
      if (!left && !right) return 0;

      return left ? -1 : 1;
    }

    const order =
      field === 'released'
        ? compareDates(left, right)
        : left.localeCompare(right, undefined, {
            sensitivity: 'base',
            numeric: true,
          });

    return reversed ? -order : order;
  });
}

export { SORT_FIELDS, fieldLabel, orderLabel, sortResults };
