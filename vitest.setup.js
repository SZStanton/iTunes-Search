import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// Globals are off, so react testing library cannot register its own teardown
afterEach(cleanup);

// jsdom has no layout, so scrollTo only prints a "not implemented" line over
// every run that pages through results. globalThis, since eslint lints this
// file as node and there is no window in that config
globalThis.scrollTo = () => {};
