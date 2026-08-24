import { z } from 'zod';

// What the client may save. Anything else iTunes sends is dropped, so a
// change at their end cannot widen what gets stored.
const favouriteSchema = z.object({
  // A number, or a string of digits. z.coerce would take true as 1 and ['5']
  // as 5, either of which squats a real item's slot.
  itemId: z.preprocess(
    value =>
      typeof value === 'string' && value.trim() !== '' ? Number(value) : value,
    z
      .number({ error: 'An item id is required.' })
      .int('An item id must be a whole number.')
      .positive('An item id must be a positive number.'),
  ),
  title: z
    .string({ error: 'A title is required.' })
    .trim()
    .min(1, 'A title is required.')
    .max(300, 'Title must be 300 characters or less.'),
  artist: z
    .string()
    .trim()
    .max(300, 'Artist must be 300 characters or less.')
    .optional()
    .default(''),
  artwork: z
    .string()
    .trim()
    .max(500, 'Artwork url must be 500 characters or less.')
    .optional()
    .default(''),
  // iTunes sends an ISO string, and an item without one is allowed.
  releaseDate: z.iso
    .datetime({ error: 'Release date must be a date.' })
    .optional(),
  kind: z
    .string()
    .trim()
    .max(60, 'Kind must be 60 characters or less.')
    .optional()
    .default(''),
});

export { favouriteSchema };
