// @vitest-environment node
import { expect, it } from 'vitest';
import { emptyBinder, place, slotAt, type Binder, type Copy } from './binder';
import { binderInteraction, moveAt, placeAt, placeRunAt, removeAt } from './binderState';
import type { SetPrinting } from './catalogue';
import { darkMagician, lostMillennium, potOfGreed } from './test/fakeCatalogue';

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

const [sphinx, sentinel, knight, idol, guardian] = lostMillennium.map((card): SetPrinting => ({
  card,
  printing: card.printings[0],
}));

it('files a Near Mint copy of each listed printing, clears the target, and announces the run', () => {
  const before = {
    ...binderState(emptyBinder()),
    aim: { kind: 'target' as const, address: first },
  };

  const after = placeRunAt(before, first, [sentinel, idol]);

  expect([slotAt(after.binder, first), slotAt(after.binder, second)]).toEqual([
    { ...sentinel, condition: 'Near Mint' },
    { ...idol, condition: 'Near Mint' },
  ]);
  expect(after.aim).toBeNull();
  expect(after.announcement.text).toBe('Placed 2 printings from page 1, slot 1 to page 1, slot 2.');
});

it('lets go of a held printing after a run', () => {
  const before = {
    ...binderState(emptyBinder()),
    aim: { kind: 'holding' as const, ...knight },
  };

  const after = placeRunAt(before, first, [sentinel, idol]);

  expect(after.aim).toBeNull();
});

it('announces a run of one printing as a single placement', () => {
  const after = placeRunAt(binderState(emptyBinder()), first, [sentinel]);

  expect(after.announcement.text).toBe('Placed TLM-EN002 in page 1, slot 1.');
});

it('keeps the binder and the held printing when too few slots follow, and says so', () => {
  const small = emptyBinder({ grid: 2, pages: 1 });
  const aim = { kind: 'holding' as const, ...knight };
  const before = { ...binderState(small), aim };

  const after = placeRunAt(before, first, [sphinx, sentinel, knight, idol, guardian]);

  expect(after.binder).toBe(small);
  expect(after.aim).toBe(aim);
  expect(after.announcement.text).toBe(
    'Only 4 empty slots from page 1, slot 1 to the end of the binder; 5 printings are listed.',
  );
});

it('names a single empty slot when refusing a run', () => {
  const small = emptyBinder({ grid: 2, pages: 1 });
  const before = binderState(small);

  const after = placeRunAt(before, { page: 1, position: 3 }, [sentinel, idol]);

  expect(after.announcement.text).toBe(
    'Only 1 empty slot from page 1, slot 4 to the end of the binder; 2 printings are listed.',
  );
});

it('says there are no empty slots when refusing a run of one printing', () => {
  const full = place(emptyBinder({ grid: 2, pages: 1 }), { page: 1, position: 3 }, pot);

  const after = placeRunAt(binderState(full), { page: 1, position: 3 }, [sentinel]);

  expect(after.announcement.text).toBe(
    'No empty slots from page 1, slot 4 to the end of the binder; 1 printing is listed.',
  );
});

it('changes nothing for a run of no printings', () => {
  const before = binderState(emptyBinder());

  const after = placeRunAt(before, first, []);

  expect(after).toBe(before);
});
