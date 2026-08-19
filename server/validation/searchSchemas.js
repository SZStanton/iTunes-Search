import { z } from 'zod';

// The labels the dropdown offers. Movie and Short Film are absent on purpose,
// Apple returns nothing for either
const MEDIA_LABELS = [
  'all',
  'podcast',
  'music',
  'album',
  'music video',
  'audiobook',
  'tv show',
  'software',
  'ebook',
];

const historySchema = z.object({
  term: z
    .string({ error: 'A search term is required.' })
    .trim()
    .min(1, 'A search term is required.')
    .max(120, 'Search term must be 120 characters or less.'),
  media: z
    .enum(MEDIA_LABELS, { error: 'That is not one of the media filters.' })
    .optional()
    .default('all'),
});

export { MEDIA_LABELS, historySchema };
