import { describe, expect, it } from 'vitest';
import { toggle } from './filterGroup';

describe('toggling a value', () => {
  it('adds a value that is not selected', () => {
    const next = toggle(new Set(['Platinum Secret Rare']), 'PLatinum Secret Rare');

    expect([...next]).toEqual(['Platinum Secret Rare', 'PLatinum Secret Rare']);
  });

  it('removes a value that is selected', () => {
    const next = toggle(new Set(['Super Rare', 'Ultra Rare']), 'Super Rare');

    expect([...next]).toEqual(['Ultra Rare']);
  });
});
