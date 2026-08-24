import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// Globals are off, so react testing library cannot register its own teardown.
afterEach(cleanup);

// jsdom has no layout, so scrollTo only prints "not implemented" on every run
// that pages. globalThis, since eslint lints this file as node.
globalThis.scrollTo = () => {};
