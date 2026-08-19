import express from 'express';

const router = express.Router();

// iTunes caps a search at 200 and ignores any offset, so paging has to happen
// on whatever one request returns
const MAX_LIMIT = 200;
const DEFAULT_LIMIT = 40;

// Artwork comes back at 100px and the cards draw it at over twice that, but the
// size is just a segment of the url, so ask for one that fits
function biggerArtwork(url) {
  return url.replace(/\/\d+x\d+bb\./, '/600x600bb.');
}

function clampLimit(raw) {
  const asked = Number(raw);
  if (!Number.isFinite(asked) || asked < 1) return DEFAULT_LIMIT;
  return Math.min(Math.floor(asked), MAX_LIMIT);
}

// Search iTunes API using search term and media type received from frontend
router.get('/search', async (req, res) => {
  const { term, media } = req.query;
  const limit = clampLimit(req.query.limit);

  // Ensure a search term was provided
  if (!term) {
    return res.status(400).json({
      message: 'Search term is required',
    });
  }

  try {
    // Build query parameters for iTunes API
    const params = new URLSearchParams({ term, limit });
    if (media) params.set('media', media);

    // Request data from iTunes Search API
    const response = await fetch(`https://itunes.apple.com/search?${params}`);

    const data = await response.json();

    // Anything with no name or no artwork cannot be drawn as a card
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

    // Count what is actually being sent, not what iTunes counted before filtering
    res.json({ results, resultCount: results.length });
  } catch (err) {
    console.error(err);

    res.status(500).json({ message: 'Failed to fetch iTunes data' });
  }
});

export default router;
