// Guards the "open this row/card" click against the stray fall-through that
// happens when a status/priority picker popover closes. Shared by every entity
// surface that opens on click and hosts pickers inside itself — issue rows,
// issue cards, project board cards.
//
// The picker is a Radix popover whose content is portaled to <body> and unmounts
// the instant an option is selected — mid-gesture. The browser then resolves the
// selecting click onto whatever now sits under the cursor (the row/card beneath),
// which would open the entity.
//
// Rather than guess a time window, we gate on WHERE the gesture began: a genuine
// open starts with a pointerdown on that surface (tagged `data-card-surface`);
// the fall-through click's pointerdown landed on the portaled popover item,
// outside any card. We record the last pointerdown's origin in the capture phase
// — before React's onClick handlers run — and let the open proceed only when the
// gesture started on a card surface. No timers, so render speed is irrelevant.

export const CARD_SURFACE_ATTR = 'data-card-surface';

let pointerDownOnSurface = false;

if (typeof document !== 'undefined') {
  document.addEventListener(
    'pointerdown',
    (e) => {
      const target = e.target as Element | null;
      pointerDownOnSurface = Boolean(target?.closest?.(`[${CARD_SURFACE_ATTR}]`));
    },
    true, // capture: runs before the popover/row handlers, and can't be stopped by them
  );
}

/** True when the in-flight click began with a pointerdown on a row/card surface. */
export function pointerDownStartedOnCardSurface() {
  return pointerDownOnSurface;
}
