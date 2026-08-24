import express from 'express';

const router = express.Router();

// iTunes caps a search at 200 and ignores offset, so paging happens over
// whatever one request returns.
const MAX_LIMIT = 200;
const DEFAULT_LIMIT = 40;

// Artwork comes back at 100px and the cards draw it larger. The size is just
// a url segment, so ask for one that fits.
function biggerArtwork(url) {
  return url.replace(/\/\d+x\d+bb\./, '/600x600bb.');
}

function clampLimit(raw) {
  const asked = Number(raw);
  if (!Number.isFinite(asked) || asked < 1) return DEFAULT_LIMIT;
  return Math.min(Math.floor(asked), MAX_LIMIT);
}

// Some filters need an entity too. Album is media=music plus entity=album.
router.get('/search', async (req, res) => {
  const { term, media, entity } = req.query;
  const limit = clampLimit(req.query.limit);

  if (!term) {
    return res.status(400).json({
      message: 'Search term is required',
    });
  }

  try {
    const params = new URLSearchParams({ term, limit });
    if (media) params.set('media', media);
    if (entity) params.set('entity', entity);

    const response = await fetch(`https://itunes.apple.com/search?${params}`);

    const data = await response.json();

    // iTunes answers a bad filter with a 200 and an errorMessage, which would
    // otherwise reach the page as "Nothing matched that search".
    if (!response.ok || data.errorMessage) {
      return res.status(502).json({
        message: 'The iTunes API could not answer that search.',
      });
    }

    // Anything with no name or artwork cannot be drawn as a card.
    const results = (data.results || [])
      .filter(item => {
        return (
          item && (item.collectionName || item.trackName) && item.artworkUrl100
        );
      })
      .map(item => ({
        ...item,
        artworkUrl600: biggerArtwork(item.artworkUrl100),
      }));

    // Count what is being sent, not what iTunes counted before filtering.
    res.json({ results, resultCount: results.length });
  } catch (err) {
    console.error(err);

    res.status(500).json({ message: 'Failed to fetch iTunes data' });
  }
});

export default router;
