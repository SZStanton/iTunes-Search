import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import SearchForm from './SearchForm';

// The input is controlled, so typing needs real state behind it or only the
// first keystroke ever lands
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

  it('changes the media type', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.selectOptions(screen.getByRole('combobox'), 'podcast');

    expect(screen.getByRole('combobox')).toHaveValue('podcast');
  });

  it('offers every media type the app supports', () => {
    render(<Harness />);

    const values = screen
      .getAllByRole('option')
      .map(option => option.getAttribute('value'));

    expect(values).toEqual([
      'all',
      'movie',
      'podcast',
      'music',
      'audiobook',
      'short film',
      'tv show',
      'software',
      'ebook',
    ]);
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
