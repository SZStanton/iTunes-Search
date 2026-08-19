import { defineConfig } from 'vitest/config';

// Date logic reads as correct from UTC+2 whether or not it is, so the suite runs
// at a negative offset where a UTC-midnight date lands on the previous day
process.env.TZ = 'America/New_York';

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'server',
          environment: 'node',
          include: ['server/**/*.test.js'],
        },
      },
      {
        test: {
          name: 'client',
          environment: 'jsdom',
          include: ['client/**/*.test.{js,jsx}'],
          setupFiles: ['./vitest.setup.js'],
        },
      },
    ],
  },
});
