import { useState } from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import SearchForm from './SearchForm';

// The input is controlled, so typing needs real state or only the first
// keystroke lands.
function Harness({ searchMedia = vi.fn(), loading = false }) {
  const [term, setTerm] = useState('');
  const [media, setMedia] = useState('music');

  return (
    <SearchForm
      term={term}
      setTerm={setTerm}
      media={media}
      setMedia={setMedia}
      searchMedia={searchMedia}
      loading={loading}
    />
  );
}

describe('the search form', () => {
  it('keeps what was typed', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.type(screen.getByPlaceholderText(/search itunes/i), 'beatles');

    expect(screen.getByPlaceholderText(/search itunes/i)).toHaveValue(
      'beatles',
    );
  });

  it('searches when the button is clicked', async () => {
    const user = userEvent.setup();
    const searchMedia = vi.fn();
    render(<Harness searchMedia={searchMedia} />);

    await user.click(screen.getByRole('button', { name: /search/i }));

    expect(searchMedia).toHaveBeenCalledOnce();
  });

  it('searches when enter is pressed in the input', async () => {
    const user = userEvent.setup();
    const searchMedia = vi.fn();
    render(<Harness searchMedia={searchMedia} />);

    await user.type(
      screen.getByPlaceholderText(/search itunes/i),
      'hey jude{Enter}',
    );

    expect(searchMedia).toHaveBeenCalledOnce();
  });

  // The chips are the only media control now. The dropdown they replaced left
  // the field 94px wide on a phone.
  const chipLabels = () =>
    within(screen.getByRole('group', { name: /media type/i }))
      .getAllByRole('button')
      .map(chip => chip.textContent);

  it('offers every media type the app supports', () => {
    render(<Harness />);

    expect(chipLabels()).toEqual([
      'All',
      'Podcast',
      'Music',
      'Album',
      'Music Video',
      'Audiobook',
      'TV Show',
      'Software',
      'Ebook',
    ]);
  });

  it('leaves out the two apple stopped answering', () => {
    render(<Harness />);

    // media=movie and media=shortFilm return nothing in every storefront.
    expect(chipLabels()).not.toContain('Movie');
    expect(chipLabels()).not.toContain('Short Film');
  });

  it('changes the media type, and marks the current one pressed', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    const chips = screen.getByRole('group', { name: /media type/i });

    expect(
      within(chips).getByRole('button', { name: 'Music' }),
    ).toHaveAttribute('aria-pressed', 'true');

    await user.click(within(chips).getByRole('button', { name: 'Podcast' }));

    expect(
      within(chips).getByRole('button', { name: 'Podcast' }),
    ).toHaveAttribute('aria-pressed', 'true');
    expect(
      within(chips).getByRole('button', { name: 'Music' }),
    ).toHaveAttribute('aria-pressed', 'false');
  });

  it('runs the search again when the type changes with a term already in', async () => {
    const user = userEvent.setup();
    const searchMedia = vi.fn();
    render(<Harness searchMedia={searchMedia} />);

    await user.type(screen.getByPlaceholderText(/search itunes/i), 'beatles');
    await user.click(
      within(screen.getByRole('group', { name: /media type/i })).getByRole(
        'button',
        { name: 'Album' },
      ),
    );

    // Changing a filter and showing the old results reads as a dead click.
    expect(searchMedia).toHaveBeenCalledWith('beatles', 'album');
  });

  it('leaves an empty search alone when the type changes', async () => {
    const user = userEvent.setup();
    const searchMedia = vi.fn();
    render(<Harness searchMedia={searchMedia} />);

    await user.click(
      within(screen.getByRole('group', { name: /media type/i })).getByRole(
        'button',
        { name: 'Album' },
      ),
    );

    expect(searchMedia).not.toHaveBeenCalled();
  });

  it('clears the field, and only offers to once there is something in it', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    expect(
      screen.queryByRole('button', { name: /clear search/i }),
    ).not.toBeInTheDocument();

    await user.type(screen.getByPlaceholderText(/search itunes/i), 'beatles');
    await user.click(screen.getByRole('button', { name: /clear search/i }));

    expect(screen.getByPlaceholderText(/search itunes/i)).toHaveValue('');
  });

  it('says so and stops accepting clicks while a search is running', async () => {
    const user = userEvent.setup();
    const searchMedia = vi.fn();
    render(<Harness searchMedia={searchMedia} loading />);

    const button = screen.getByRole('button', { name: /searching/i });

    expect(button).toBeDisabled();
    await user.click(button);
    expect(searchMedia).not.toHaveBeenCalled();
  });
});
