import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Clean DOM after each test
afterEach(() => {
    cleanup();
});