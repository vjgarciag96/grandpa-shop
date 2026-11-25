// @vitest-environment node
import { expect, it } from 'vitest';
import { emptyBinder, place, slotAt, type Binder, type Copy } from './binder';
import { binderInteraction, moveAt, placeAt, removeAt } from './binderState';
import { darkMagician, potOfGreed } from './test/fakeCatalogue';

const binderState = (binder: Binder) => ({ binder, ...binderInteraction() });

const first = { page: 1, position: 0 };
const second = { page: 1, position: 1 };
const magician: Copy = {
  card: darkMagician,
  printing: darkMagician.printings[1],
  condition: 'Lightly Played',
};
const pot: Copy = {
  card: potOfGreed,
  printing: potOfGreed.printings[0],
  condition: 'Near Mint',
};

it('files a Near Mint replacement and names the previous printing', () => {
  const before = binderState(place(emptyBinder(), first, magician));

  const after = placeAt(before, first, pot.card, pot.printing);

  expect(slotAt(after.binder, first)).toEqual(pot);
  expect(after.announcement.text).toBe('Placed LOB-EN119 in page 1, slot 1, replacing SDY-006.');
});

it('swaps the copies and clears a catalogue target on the source pocket', () => {
  const filled = place(place(emptyBinder(), first, magician), second, pot);
  const before = {
    ...binderState(filled),
    aim: { kind: 'target' as const, address: first },
  };

  const after = moveAt(before, second, first, magician);

  expect([slotAt(after.binder, first), slotAt(after.binder, second)]).toEqual([pot, magician]);
  expect(after.aim).toBeNull();
  expect(after.moveAnnouncement.text).toBe(
    'Swapped SDY-006 to page 1, slot 2 and LOB-EN119 to page 1, slot 1.',
  );
});

it('keeps a catalogue target when the copy is dragged out of its pocket', () => {
  const aim = { kind: 'target' as const, address: first };
  const before = { ...binderState(place(emptyBinder(), first, magician)), aim };

  const after = removeAt(before, first, magician);

  expect(slotAt(after.binder, first)).toBeNull();
  expect(after.aim).toEqual(aim);
  expect(after.moveAnnouncement.text).toBe('Removed SDY-006 from page 1, slot 1.');
});
