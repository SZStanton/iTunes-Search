import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import SearchForm from './SearchForm';
import { MEDIA_LABELS } from '../../../server/validation/searchSchemas.js';

// The dropdown and the server's allowed list are written in two places, so they
// will drift. Adding a filter to one and not the other would 400 every history
// write for it, with the rest of the suite still green

describe('the media filters on both sides', () => {
  it('offers exactly the labels the server will accept', () => {
    render(
      <SearchForm
        term=""
        setTerm={() => {}}
        media="music"
        setMedia={() => {}}
        searchMedia={() => {}}
        loading={false}
      />,
    );

    const offered = screen
      .getAllByRole('option')
      .map(option => option.getAttribute('value'));

    expect([...offered].sort()).toEqual([...MEDIA_LABELS].sort());
  });
});
