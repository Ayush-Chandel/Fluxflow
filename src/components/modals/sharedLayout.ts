import { arc } from "motion/react"

export const CREATE_ISSUE_LAYOUT_ID = 'create-issue-surface'

export const CREATE_ISSUE_PILL_LAYOUT_TRANSITION = {
  opacity: { duration: 0.15, ease: 'easeOut' },
  layout: {
    type: 'spring',
    visualDuration: 0.35,
    bounce: 0.1,
    path: arc({strength: 0.4, peak: 0.35, direction: 'cw'})
   },
} as const

export const CREATE_ISSUE_MODAL_LAYOUT_TRANSITION = {
  opacity: { duration: 0.15, ease: 'easeOut' },
  layout: {
    type: 'spring',
    visualDuration: 0.35,
    bounce: 0.1,
    path: arc({strength: 0.4, peak: 0.65, direction: 'ccw'})
   },
} as const

export const CREATE_ISSUE_MORPH_CONTENT_DELAY = 0.3

export const createIssueContentFade = (delay: number) =>
  ({
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { duration: 0.15, ease: 'easeOut', delay } },
    // Near-instant on purpose. The exiting surface keeps its `layoutId`, so it is
    // projected onto the same interpolating box as the incoming one — i.e. it is
    // still being scaled while it fades. At 90ms the pill's box is already ~4x
    // taller than it started, which smears any text still painted. The shell
    // fades over 150ms and covers the gap.
    exit: { opacity: 0, transition: { duration: 0.06, ease: 'easeIn' } },
  }) as const
