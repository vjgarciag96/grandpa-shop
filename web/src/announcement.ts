/** What a live region says aloud. Each new message counts up, so a repeated one is read again. */
export type Announcement = { readonly text: string; readonly count: number };

export const silence: Announcement = { text: '', count: 0 };

export function announced(current: Announcement, text: string): Announcement {
  return { text, count: current.count + 1 };
}

export function silenced(current: Announcement): Announcement {
  return { ...current, text: '' };
}
