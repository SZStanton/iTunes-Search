// fireEvent for the one case below. A failed image load is the browser's
// event, not something anybody clicks.
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import FavouriteList from './FavouriteList';

const favourites = [
  {
    id: 1,
    title: 'Here Comes the Sun',
    artistName: 'The Beatles',
    artworkUrl100: 'https://example.test/sun.jpg',
  },
  {
    id: 2,
    title: 'Windmills',
    artistName: 'Jordan Blake',
    artworkUrl100: 'https://example.test/windmills.jpg',
  },
];

describe('the favourites list', () => {
  it('says when there is nothing in it', () => {
    render(<FavouriteList favourites={[]} removeFavourite={vi.fn()} />);

    expect(screen.getByText(/nothing saved yet/i)).toBeInTheDocument();
  });

  it('shows the title and artist of each one', () => {
    render(<FavouriteList favourites={favourites} removeFavourite={vi.fn()} />);

    expect(screen.getByText('Here Comes the Sun')).toBeInTheDocument();
    expect(screen.getByText('The Beatles')).toBeInTheDocument();
    expect(screen.getByText('Windmills')).toBeInTheDocument();
    expect(screen.getByText('Jordan Blake')).toBeInTheDocument();
    expect(screen.queryByText(/nothing saved yet/i)).not.toBeInTheDocument();
  });

  it('drops a rotted artwork url without leaving a broken image', () => {
    render(<FavouriteList favourites={favourites} removeFavourite={vi.fn()} />);

    fireEvent.error(screen.getByAltText('Here Comes the Sun'));

    expect(screen.queryByAltText('Here Comes the Sun')).not.toBeInTheDocument();
    // The other one is untouched, so the failure is per row.
    expect(screen.getByAltText('Windmills')).toBeInTheDocument();
    expect(screen.getByText('Here Comes the Sun')).toBeInTheDocument();
  });

  it('labels the artwork with the title, so it is not an empty alt', () => {
    render(<FavouriteList favourites={favourites} removeFavourite={vi.fn()} />);

    expect(screen.getByAltText('Here Comes the Sun')).toHaveAttribute(
      'src',
      'https://example.test/sun.jpg',
    );
  });

  it('removes the one whose button was clicked, not the first', async () => {
    const user = userEvent.setup();
    const removeFavourite = vi.fn();
    render(
      <FavouriteList
        favourites={favourites}
        removeFavourite={removeFavourite}
      />,
    );

    await user.click(screen.getAllByRole('button', { name: /remove/i })[1]);

    expect(removeFavourite).toHaveBeenCalledWith(2);
  });
});
