import { render, screen } from '@testing-library/react';
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
  render(
    <ResultsList
      results={results}
      favourites={props.favourites ?? []}
      addFavourite={addFavourite}
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

  it('marks only the favourited song as added', () => {
    renderList(sameAlbum, { favourites: [{ id: 1441164589 }] });

    expect(screen.getByRole('button', { name: /added/i })).toBeDisabled();
    expect(
      screen.getByRole('button', { name: /add favourite/i }),
    ).toBeEnabled();
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

  it('says unknown when there is no release date', () => {
    renderList([
      {
        trackId: 7,
        trackName: 'Windmills',
        artistName: 'Jordan Blake',
        artworkUrl100: 'https://example.test/windmills.jpg',
      },
    ]);

    expect(screen.getByText('Unknown')).toBeInTheDocument();
  });
});
