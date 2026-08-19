import express from 'express';

const router = express.Router();

// Search iTunes API using search term and media type received from frontend
router.get('/search', async (req, res) => {
  const { term, media, limit = 40 } = req.query;

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

    // Return API filtered results to the frontend
    const results = (data.results || []).filter(item => {
      return (
        item && (item.collectionName || item.trackName) && item.artworkUrl100
      );
    });

    res.json({ results, resultCount: data.resultCount });
  } catch (err) {
    console.error(err);

    res.status(500).json({ message: 'Failed to fetch iTunes data' });
  }
});

export default router;
