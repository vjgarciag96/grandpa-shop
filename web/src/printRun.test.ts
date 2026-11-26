import { describe, expect, it } from 'vitest';
import { printRunOf } from './printRun';

describe('print run of a set code', () => {
  it('keeps the letters between the hyphen and the number', () => {
    const run = printRunOf('LOB-EN001');

    expect(run).toBe('LOB-EN');
  });

  it('keeps a single letter between the hyphen and the number', () => {
    const run = printRunOf('LOB-E001');

    expect(run).toBe('LOB-E');
  });

  it('ends at the hyphen when the number follows it', () => {
    const run = printRunOf('LOB-001');

    expect(run).toBe('LOB-');
  });

  it('keeps digits before the hyphen', () => {
    const run = printRunOf('DB1-EN001');

    expect(run).toBe('DB1-EN');
  });

  it('is the whole code when the code has no hyphen', () => {
    const run = printRunOf('DB1EN001');

    expect(run).toBe('DB1EN001');
  });

  it('is the whole code when the code has no trailing number', () => {
    const run = printRunOf('LOB-EN001a');

    expect(run).toBe('LOB-EN001a');
  });
});
