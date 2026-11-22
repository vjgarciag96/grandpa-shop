import tokens from "../../design/tokens.json";

/** Sets every design token as a CSS custom property on [root], so styles never repeat a value. */
export function applyTokens(root: HTMLElement) {
  const properties: Record<string, string> = {
    "--color-ink": tokens.color.ink,
    "--color-paper": tokens.color.paper,
    "--color-binder-board": tokens.color.binderBoard,
    "--color-page": tokens.color.page,
    "--color-foil": tokens.color.foil,
    "--color-rule": tokens.color.rule,
    "--color-slot-edge": tokens.color.slotEdge,
    "--font-display": tokens.typography.display,
    "--font-body": tokens.typography.body,
    "--space-slot": `${tokens.space.slot}px`,
    "--radius-card": `${tokens.radius.cardPx}px`,
    "--pocket-aspect": tokens.layout.pocketAspect,
    "--pocket-gap": `${tokens.layout.pocketGapPx}px`,
    "--page-padding": `${tokens.layout.pagePaddingPx}px`,
    "--board-padding": `${tokens.layout.boardPaddingPx}px`,
    "--spine": `${tokens.layout.spinePx}px`,
    "--empty-slot-stroke": `${tokens.layout.emptySlotStrokePx}px`,
    "--page-flip": `${tokens.motion.pageFlipMs}ms`,
    "--easing": tokens.motion.easing,
  };
  for (const [name, value] of Object.entries(properties)) {
    root.style.setProperty(name, value);
  }
}

/** The viewport width below which a spread's pages stack. CSS media queries cannot read a custom property. */
export const STACK_BELOW_PX = tokens.layout.stackBelowPx;

/** How long a page-turn plays. Timers need it as a number, not as a custom property. */
export const PAGE_FLIP_MS = tokens.motion.pageFlipMs;

/** How far a horizontal swipe on the spread travels before it turns the binder. */
export const SWIPE_THRESHOLD_PX = tokens.motion.swipeThresholdPx;
