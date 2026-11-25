import tokens from '../../design/tokens.json';
import type { PocketGrid } from './binder';

/** Sets every design token as a CSS custom property on [root], so styles never repeat a value. */
export function applyTokens(root: HTMLElement) {
  const properties: Record<string, string> = {
    '--color-primary': tokens.color.primary,
    '--color-on-primary': tokens.color.onPrimary,
    '--color-primary-container': tokens.color.primaryContainer,
    '--color-on-primary-container': tokens.color.onPrimaryContainer,
    '--color-secondary-container': tokens.color.secondaryContainer,
    '--color-on-secondary-container': tokens.color.onSecondaryContainer,
    '--color-surface': tokens.color.surface,
    '--color-surface-container-low': tokens.color.surfaceContainerLow,
    '--color-surface-container': tokens.color.surfaceContainer,
    '--color-surface-container-high': tokens.color.surfaceContainerHigh,
    '--color-surface-container-highest': tokens.color.surfaceContainerHighest,
    '--color-on-surface': tokens.color.onSurface,
    '--color-on-surface-variant': tokens.color.onSurfaceVariant,
    '--color-outline': tokens.color.outline,
    '--color-outline-variant': tokens.color.outlineVariant,
    '--color-error': tokens.color.error,
    '--color-binder-board': tokens.color.binderBoard,
    '--color-binder-page': tokens.color.binderPage,
    '--color-foil': tokens.color.foil,
    '--font-body': tokens.typography.body,
    '--type-headline': `${tokens.typography.headlinePx}px`,
    '--type-title-large': `${tokens.typography.titleLargePx}px`,
    '--type-title': `${tokens.typography.titlePx}px`,
    '--type-body': `${tokens.typography.bodyPx}px`,
    '--type-body-small': `${tokens.typography.bodySmallPx}px`,
    '--type-label-small': `${tokens.typography.labelSmallPx}px`,
    '--space-slot': `${tokens.space.slot}px`,
    '--radius-card': `${tokens.radius.cardPx}px`,
    '--radius-surface': `${tokens.radius.surfacePx}px`,
    '--radius-dialog': `${tokens.radius.dialogPx}px`,
    '--target-size': `${tokens.layout.minTargetPx}px`,
    '--pocket-aspect': tokens.layout.pocketAspect,
    '--pocket-gap': `${tokens.layout.pocketGapPx}px`,
    '--page-padding': `${tokens.layout.pagePaddingPx}px`,
    '--board-padding': `${tokens.layout.boardPaddingPx}px`,
    '--spine': `${tokens.layout.spinePx}px`,
    '--empty-slot-stroke': `${tokens.layout.emptySlotStrokePx}px`,
    '--aim-stroke': `${tokens.layout.aimStrokePx}px`,
    '--panel-width': `${tokens.layout.panelWidthPx}px`,
    '--sheet-height': `${tokens.layout.sheetHeightPercent}dvh`,
    '--drag-ghost-opacity': String(tokens.layout.dragGhostOpacity),
    '--drag-ghost-removing-opacity': String(tokens.layout.dragGhostRemovingOpacity),
    '--page-flip': `${tokens.motion.pageFlipMs}ms`,
    '--easing': tokens.motion.easing,
  };
  for (const [name, value] of Object.entries(properties)) {
    root.style.setProperty(name, value);
  }
}

/** The viewport width below which a spread's pages stack. CSS media queries cannot read a custom property. */
export const STACK_BELOW_PX = tokens.layout.stackBelowPx;

/** Leave room for each pocket's minimum target width before putting the catalogue beside it. */
export function panelBesideFrom(grid: PocketGrid): number {
  const layout = tokens.layout;
  const pageWidth =
    grid * layout.minTargetPx + (grid - 1) * layout.pocketGapPx + 2 * layout.pagePaddingPx;
  // The desk has up to three spacing units of padding on each side and three between the columns.
  const deskSpacing = 9 * tokens.space.slot;
  const deskWidth =
    deskSpacing + layout.panelWidthPx + 2 * layout.boardPaddingPx + layout.spinePx + 2 * pageWidth;
  return Math.max(layout.panelBesideFromPx, deskWidth);
}

/** How long a page-turn plays. Timers need it as a number, not as a custom property. */
export const PAGE_FLIP_MS = tokens.motion.pageFlipMs;

/** How far a horizontal swipe on the spread travels before it turns the binder. */
export const SWIPE_THRESHOLD_PX = tokens.motion.swipeThresholdPx;

/** The least share of the dragged card's area a pocket must cover, where you can see it, to be a drop target. */
export const DROP_MIN_COVER_SHARE = tokens.layout.dropMinCoverShare;

/** How far a press on a printing moves before it becomes a drag rather than a tap. */
export const DRAG_START_PX = tokens.motion.dragStartPx;
