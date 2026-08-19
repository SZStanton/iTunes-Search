import { z } from 'zod';

// What the client is allowed to save. Anything else iTunes sends is dropped,
// so a change at their end cannot quietly widen what gets stored
const favouriteSchema = z.object({
  itemId: z.coerce
    .number({ error: 'An item id is required.' })
    .int('An item id must be a whole number.')
    .positive('An item id must be a positive number.'),
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
  // iTunes sends an ISO string, and an item without one is allowed
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
