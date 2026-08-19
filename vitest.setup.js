import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// Globals are off, so react testing library cannot register its own teardown
afterEach(cleanup);
