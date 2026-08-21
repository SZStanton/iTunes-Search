import Favourite from '../models/Favourite.js';
import Search from '../models/Search.js';

// Real results pulled from the iTunes API, so the artwork actually loads and
// the demo looks like someone has used it rather than like fixture data

const DEMO_FAVOURITES = [
  {
    itemId: 1441164589,
    title: 'Here Comes the Sun',
    artist: 'The Beatles',
    artwork:
      'https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/df/db/61/dfdb615d-47f8-06e9-9533-b96daccc029f/18UMGIM31076.rgb.jpg/600x600bb.jpg',
    releaseDate: '1969-09-26T12:00:00Z',
    kind: 'song',
  },
  {
    itemId: 1440650711,
    title: 'Bohemian Rhapsody',
    artist: 'Queen',
    artwork:
      'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/4d/08/2a/4d082a9e-7898-1aa1-a02f-339810058d9e/14DMGIM05632.rgb.jpg/600x600bb.jpg',
    releaseDate: '1975-10-31T12:00:00Z',
    kind: 'song',
  },
  {
    itemId: 394775318,
    title: '99% Invisible',
    artist: 'Roman Mars',
    artwork:
      'https://is1-ssl.mzstatic.com/image/thumb/Podcasts211/v4/79/d0/35/79d035ea-9043-b43e-7380-33cd47bd968b/mza_2606971010425550919.jpg/600x600bb.jpg',
    kind: 'podcast',
  },
  {
    itemId: 1602694961,
    title: 'The Hobbit',
    artist: 'J. R. R. Tolkien',
    artwork:
      'https://is1-ssl.mzstatic.com/image/thumb/Publication122/v4/8a/d8/61/8ad861cd-9c83-512c-d13e-022e625ef4b6/9780547951973.jpg/600x600bb.jpg',
    releaseDate: '2012-02-15T08:00:00Z',
    kind: 'ebook',
  },
];

// Oldest first, so the newest ends up at the top of the list
const DEMO_SEARCHES = [
  { term: 'tolkien', media: 'ebook' },
  { term: '99% invisible', media: 'podcast' },
  { term: 'queen', media: 'album' },
  { term: 'the beatles', media: 'music' },
];

// Wipes whatever the last visitor did and puts the seed back. Called by the
// seed script and again on every demo login, so nobody inherits a mess
async function resetDemoData(user) {
  await Promise.all([
    Favourite.deleteMany({ user: user.id }),
    Search.deleteMany({ user: user.id }),
  ]);

  // Both lists are read newest first, and writes inside one millisecond would
  // tie, so the timestamps are set a minute apart rather than left to the clock
  const minuteApart = index => new Date(Date.now() - (10 - index) * 60 * 1000);

  // Two demo logins at once interleave the delete and the insert, and a
  // duplicate just means the other login already wrote that exact row
  const ignoringDuplicates = async write => {
    try {
      await write;
    } catch (err) {
      if (err.code !== 11000) throw err;
    }
  };

  // No expiresAt on any of it, the demo account and its data never expire
  await ignoringDuplicates(
    Favourite.insertMany(
      DEMO_FAVOURITES.map((favourite, index) => ({
        ...favourite,
        user: user.id,
        createdAt: minuteApart(index),
        updatedAt: minuteApart(index),
      })),
      { timestamps: false, ordered: false },
    ),
  );

  await ignoringDuplicates(
    Search.insertMany(
      DEMO_SEARCHES.map((search, index) => ({
        ...search,
        termKey: search.term.toLowerCase(),
        user: user.id,
        createdAt: minuteApart(index),
        updatedAt: minuteApart(index),
      })),
      { timestamps: false, ordered: false },
    ),
  );
}

export { DEMO_FAVOURITES, DEMO_SEARCHES, resetDemoData };
