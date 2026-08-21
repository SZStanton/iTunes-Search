import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import ResultCard from './ResultCard';
import { OverlayProvider } from '../context/OverlayContext';

const item = {
  trackId: 7,
  trackName: 'Windmills',
  artistName: 'Jordan Blake',
  artworkUrl100: 'https://example.test/100x100bb.jpg',
  artworkUrl600: 'https://example.test/600x600bb.jpg',
  kind: 'song',
  releaseDate: '2024-03-01T07:00:00Z',
};

function renderCard(props = {}) {
  const addFavourite = props.addFavourite ?? vi.fn();
  const removeFavourite = props.removeFavourite ?? vi.fn();

  render(
    <OverlayProvider>
      <ResultCard
        item={item}
        id={7}
        title="Windmills"
        isFavourite={props.isFavourite ?? false}
        addFavourite={addFavourite}
        removeFavourite={removeFavourite}
      />
    </OverlayProvider>,
  );

  return { addFavourite, removeFavourite };
}

async function openViewer(user) {
  await user.click(screen.getByRole('button', { name: /view windmills/i }));

  return screen.getByRole('dialog', { name: 'Windmills' });
}

describe('the artwork viewer', () => {
  it('opens from the artwork and shows what the result is', async () => {
    const user = userEvent.setup();
    renderCard();

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    const viewer = await openViewer(user);

    expect(viewer).toHaveTextContent('Windmills');
    expect(viewer).toHaveTextContent('Jordan Blake');
    expect(viewer).toHaveTextContent('Music · 2024');
  });

  it('shows the big artwork rather than the one in the grid', async () => {
    const user = userEvent.setup();
    renderCard();

    const viewer = await openViewer(user);

    expect(within(viewer).getByAltText('Windmills')).toHaveAttribute(
      'src',
      'https://example.test/600x600bb.jpg',
    );
  });

  it('closes on escape and hands focus back to the artwork', async () => {
    const user = userEvent.setup();
    renderCard();

    const artwork = screen.getByRole('button', { name: /view windmills/i });
    await user.click(artwork);
    await user.keyboard('{Escape}');

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(artwork).toHaveFocus();
  });

  it('saves a favourite from inside the viewer', async () => {
    const user = userEvent.setup();
    const { addFavourite } = renderCard();

    const viewer = await openViewer(user);
    await user.click(
      within(viewer).getByRole('button', { name: /save to favourites/i }),
    );

    expect(addFavourite).toHaveBeenCalledWith(
      expect.objectContaining({ id: 7, title: 'Windmills' }),
    );
  });

  it('offers to take it off again once it is saved', async () => {
    const user = userEvent.setup();
    const { removeFavourite } = renderCard({ isFavourite: true });

    const viewer = await openViewer(user);
    await user.click(
      within(viewer).getByRole('button', { name: /saved to favourites/i }),
    );

    expect(removeFavourite).toHaveBeenCalledWith(7);
  });
});
