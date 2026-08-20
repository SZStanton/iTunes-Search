// fireEvent rather than user-event for the one case below, since a failed
// image load is the browser's event and not something anybody clicks
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import ResultsList from './ResultsList';

// Two songs from one album, which is the case that used to collapse into one
const sameAlbum = [
  {
    trackId: 1441164589,
    trackName: 'Here Comes the Sun',
    collectionId: 1441164426,
    collectionName: 'Abbey Road',
    artistName: 'The Beatles',
    artworkUrl100: 'https://example.test/sun.jpg',
    releaseDate: '1969-09-26T07:00:00Z',
  },
  {
    trackId: 1441164468,
    trackName: 'Come Together',
    collectionId: 1441164426,
    collectionName: 'Abbey Road',
    artistName: 'The Beatles',
    artworkUrl100: 'https://example.test/come.jpg',
    releaseDate: '1969-09-26T07:00:00Z',
  },
];

function renderList(results, props = {}) {
  const addFavourite = props.addFavourite ?? vi.fn();
  const removeFavourite = props.removeFavourite ?? vi.fn();

  render(
    <ResultsList
      results={results}
      favourites={props.favourites ?? []}
      addFavourite={addFavourite}
      removeFavourite={removeFavourite}
    />,
  );

  return addFavourite;
}

describe('the results list', () => {
  it('shows the track name rather than the album it came from', () => {
    renderList(sameAlbum);

    expect(screen.getByText('Here Comes the Sun')).toBeInTheDocument();
    expect(screen.getByText('Come Together')).toBeInTheDocument();
    expect(screen.queryByText('Abbey Road')).not.toBeInTheDocument();
  });

  it('keeps two songs off one album apart', async () => {
    const user = userEvent.setup();
    const addFavourite = renderList(sameAlbum);

    const buttons = screen.getAllByRole('button', { name: /add favourite/i });
    await user.click(buttons[0]);
    await user.click(buttons[1]);

    expect(addFavourite).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ id: 1441164589, title: 'Here Comes the Sun' }),
    );
    expect(addFavourite).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ id: 1441164468, title: 'Come Together' }),
    );
  });

  it('marks only the favourited song as saved', () => {
    renderList(sameAlbum, { favourites: [{ id: 1441164589 }] });

    expect(
      screen.getByRole('button', { name: /remove favourite/i }),
    ).toHaveAttribute('aria-pressed', 'true');
    expect(
      screen.getByRole('button', { name: /add favourite/i }),
    ).toHaveAttribute('aria-pressed', 'false');
  });

  it('takes a favourite off again from the card it was added on', async () => {
    const user = userEvent.setup();
    const removeFavourite = vi.fn();

    renderList(sameAlbum, {
      favourites: [{ id: 1441164589 }],
      removeFavourite,
    });

    await user.click(screen.getByRole('button', { name: /remove favourite/i }));

    expect(removeFavourite).toHaveBeenCalledWith(1441164589);
  });

  it('falls back to the collection when a result has no track', () => {
    renderList([
      {
        collectionId: 909253,
        collectionName: 'Jordan Blake Live',
        artistName: 'Jordan Blake',
        artworkUrl100: 'https://example.test/live.jpg',
      },
    ]);

    expect(screen.getByText('Jordan Blake Live')).toBeInTheDocument();
  });

  it('draws the bigger artwork when the server offers it', () => {
    renderList([
      {
        trackId: 7,
        trackName: 'Windmills',
        artistName: 'Jordan Blake',
        artworkUrl100: 'https://example.test/100x100bb.jpg',
        artworkUrl600: 'https://example.test/600x600bb.jpg',
      },
    ]);

    expect(screen.getByAltText('Windmills')).toHaveAttribute(
      'src',
      'https://example.test/600x600bb.jpg',
    );
  });

  it('falls back to the small artwork when there is no bigger one', () => {
    renderList([
      {
        trackId: 8,
        trackName: 'Harbour',
        artistName: 'Jordan Blake',
        artworkUrl100: 'https://example.test/100x100bb.jpg',
      },
    ]);

    expect(screen.getByAltText('Harbour')).toHaveAttribute(
      'src',
      'https://example.test/100x100bb.jpg',
    );
  });

  it('puts the title in the tile when the artwork will not load', async () => {
    renderList([
      {
        trackId: 9,
        trackName: 'Low Tide',
        artistName: 'Jordan Blake',
        artworkUrl100: 'https://example.test/gone.jpg',
        kind: 'song',
      },
    ]);

    const artwork = screen.getByAltText('Low Tide');
    // jsdom never loads an image, so the failure has to be fired by hand
    fireEvent.error(artwork);

    expect(screen.queryByAltText('Low Tide')).not.toBeInTheDocument();
    // Twice now: once in the tile that replaced the artwork, once underneath
    expect(screen.getAllByText('Low Tide')).toHaveLength(2);
  });

  it('does not carry a failed image over to the next page', () => {
    const gone = [
      {
        trackName: 'Low Tide',
        artistName: 'Jordan Blake',
        artworkUrl100: 'https://example.test/gone.jpg',
      },
    ];
    const fine = [
      {
        trackName: 'High Tide',
        artistName: 'Jordan Blake',
        artworkUrl100: 'https://example.test/here.jpg',
      },
    ];

    const { rerender } = render(
      <ResultsList results={gone} favourites={[]} addFavourite={vi.fn()} />,
    );

    fireEvent.error(screen.getByAltText('Low Tide'));
    expect(screen.queryByAltText('Low Tide')).not.toBeInTheDocument();

    // Neither result has an id of its own, so both land on the same index key
    // and React hands the second one the card that just failed
    rerender(
      <ResultsList results={fine} favourites={[]} addFavourite={vi.fn()} />,
    );

    expect(screen.getByAltText('High Tide')).toBeInTheDocument();
  });

  it('labels a result by what it is and when it came out', () => {
    renderList([
      {
        trackId: 7,
        trackName: 'Windmills',
        artistName: 'Jordan Blake',
        artworkUrl100: 'https://example.test/windmills.jpg',
        kind: 'song',
        releaseDate: '2024-03-01T07:00:00Z',
      },
    ]);

    expect(screen.getByText('Music · 2024')).toBeInTheDocument();
  });

  it('drops whichever half of that label is missing', () => {
    renderList([
      {
        trackId: 8,
        trackName: 'Harbour',
        artistName: 'Jordan Blake',
        artworkUrl100: 'https://example.test/harbour.jpg',
        kind: 'song',
      },
      {
        trackId: 9,
        trackName: 'Low Tide',
        artistName: 'Jordan Blake',
        artworkUrl100: 'https://example.test/low.jpg',
        releaseDate: '1999-01-01T00:00:00Z',
      },
    ]);

    expect(screen.getByText('Music')).toBeInTheDocument();
    // Stored as UTC midnight, so reading the year locally would say 1998 here
    expect(screen.getByText('1999')).toBeInTheDocument();
  });
});
