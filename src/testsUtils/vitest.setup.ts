import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Clean DOM after each test
afterEach(() => {
    cleanup();
});

// Tests invoke data functions directly, outside the Next.js cache runtime.
vi.mock("next/cache", () => ({ cacheLife: vi.fn() }));
