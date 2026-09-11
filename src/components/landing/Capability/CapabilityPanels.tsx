import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

import {
  motion,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";

import type { Capability } from "@/types/landing";
import { capabilities } from "@/components/common/constants/constants";

import { CapabilityDetails } from "./CapabilityDetails";
import { CapabilityVisual } from "./CapabilityVisual";

/* ============================================================
 * SCROLL TUNING
 * ========================================================== */

/*
 * Normal scroll → card progress.
 *
 * Lower:
 *   more scrolling required
 *
 * Higher:
 *   less scrolling required
 */
const SCROLL_TO_PROGRESS = 0.0035;

const MAX_PROGRESS_PER_UPDATE = 0.40;

/*
 * Tiny floating point values near 1 are treated as complete.
 */
const COMPLETION_THRESHOLD = 0.995;

/*
 * The normal interaction zone.
 *
 * The section starts responding when its top reaches ~72%
 * of the viewport.
 */
const ACTIVATION_TOP = 0.72;

/*
 * Normal interaction ends when the section's bottom is above
 * this portion of the viewport.
 */
const ACTIVATION_BOTTOM = 0.72;

/* ============================================================
 * CARD LAYOUT
 * ========================================================== */

const COMPACT_HEIGHT = 118;

/*
 * Expanded card gets ~30% more room than its natural content.
 */
const EXPANDED_CONTENT_MULTIPLIER = 1.3;

/*
 * py-6 = 24px top + 24px bottom.
 */
const CARD_PADDING_Y = 48;

export default function CapabilityPanels() {
  const sectionRef = useRef<HTMLElement>(null);

  const [cardTargets, setCardTargets] = useState<number[]>(
    () => capabilities.map(() => 0)
  );

  /*
   * Keep the values outside React too.
   *
   * This is useful because the scroll callback can get called
   * many times before React has rendered the previous state.
   */
  const cardTargetsRef = useRef<number[]>(
    capabilities.map(() => 0)
  );

  const { scrollY } = useScroll();

  /*
   * Previous page scroll position.
   */
  const lastScrollY = useRef<number | null>(null);

  /*
   * Whether the section is currently inside the normal
   * interaction zone.
   */
  const sectionActiveRef = useRef(false);

  /*
   * Whether we have already started interacting with the section.
   *
   * This prevents the "complete everything in background" logic
   * from triggering before the user has actually reached the
   * capability section.
   */
  const sectionStartedRef = useRef(false);

  /* ==========================================================
   * SECTION ACTIVITY
   * ======================================================== */

  const getSectionState = useCallback(() => {
    const section = sectionRef.current;

    if (!section) {
      return {
        active: false,
        passedDown: false,
        passedUp: false,
      };
    }

    const rect = section.getBoundingClientRect();

    const viewportHeight = window.innerHeight;

    const active =
      rect.top <=
        viewportHeight * ACTIVATION_TOP &&
      rect.bottom >=
        viewportHeight * ACTIVATION_BOTTOM;

    /*
     * The whole section has effectively moved above the viewport.
     *
     * This can happen when the user scrolls very quickly downward.
     */
    const passedDown =
      rect.bottom <
      viewportHeight * ACTIVATION_BOTTOM;

    /*
     * The whole section is effectively below the viewport.
     *
     * This happens when the user has scrolled upward past it.
     */
    const passedUp =
      rect.top >
      viewportHeight * ACTIVATION_TOP;

    return {
      active,
      passedDown,
      passedUp,
    };
  }, []);

  /* ==========================================================
   * SCROLL CONTROLLER
   * ======================================================== */

  useEffect(() => {
    const unsubscribe = scrollY.on("change", (latest) => {
      const previous = lastScrollY.current;

      lastScrollY.current = latest;

      if (previous === null) {
        return;
      }

      const delta = latest - previous;

      if (Math.abs(delta) < 0.25) {
        return;
      }

      const {
        active,
        passedDown,
        passedUp,
      } = getSectionState();

      sectionActiveRef.current = active;

      /* ======================================================
       * SCROLL DOWN
       * ==================================================== */

      if (delta > 0) {
        /*
         * User has reached the normal interaction zone.
         */
        if (active) {
          sectionStartedRef.current = true;
        }

        /*
         * If the section has already been entered and the user
         * scrolls fast enough to pass it completely, finish all
         * remaining cards in the background.
         *
         * IMPORTANT:
         *
         * We're changing TARGETS only.
         *
         * The actual card animation still takes its normal
         * amount of time.
         */
        if (
          sectionStartedRef.current &&
          passedDown
        ) {
          setCardTargets(() => {
            const next = capabilities.map(
              () => 1
            );

            cardTargetsRef.current = next;

            return next;
          });

          return;
        }

        /*
         * Before reaching the section, normal page scrolling
         * should have no effect on the cards.
         */
        if (!active) {
          return;
        }

        /*
         * Convert scroll distance into a small progress amount.
         */
        const nudge = Math.min(
          Math.abs(delta) *
            SCROLL_TO_PROGRESS,
          MAX_PROGRESS_PER_UPDATE
        );

        if (nudge <= 0) {
          return;
        }

        setCardTargets((current) => {
          const next = [...current];

          /*
           * Find the first card that is not fully expanded.
           *
           * This preserves:
           *
           * 01 → 02 → 03
           */
          const activeIndex = next.findIndex(
            (value) =>
              value <
              COMPLETION_THRESHOLD
          );

          if (activeIndex === -1) {
            return current;
          }

          next[activeIndex] =
            Math.min(
              1,
              next[activeIndex] +
                nudge
            );

          /*
           * Snap tiny remaining values to 1.
           */
          if (
            next[activeIndex] >=
            COMPLETION_THRESHOLD
          ) {
            next[activeIndex] = 1;
          }

          cardTargetsRef.current = next;

          return next;
        });

        return;
      }

      /* ======================================================
       * SCROLL UP
       * ==================================================== */

      /*
       * If the user has scrolled all the way back above the
       * capability section, reset the state.
       *
       * This handles a very fast upward scroll that completely
       * jumps over the section.
       */
      if (
        sectionStartedRef.current &&
        passedUp
      ) {
        setCardTargets(() => {
          const next = capabilities.map(
            () => 0
          );

          cardTargetsRef.current = next;

          sectionStartedRef.current = false;

          return next;
        });

        return;
      }

      /*
       * We only collapse while the section is in its interaction
       * region.
       */
      if (!active) {
        return;
      }

      const nudge = Math.min(
        Math.abs(delta) *
          SCROLL_TO_PROGRESS,
        MAX_PROGRESS_PER_UPDATE
      );

      if (nudge <= 0) {
        return;
      }

      setCardTargets((current) => {
        const next = [...current];

        /*
         * Find the LAST card with progress.
         *
         * This guarantees reverse order:
         *
         * 03 → 02 → 01
         */
        let activeIndex = -1;

        for (
          let i = next.length - 1;
          i >= 0;
          i--
        ) {
          if (next[i] > 0) {
            activeIndex = i;
            break;
          }
        }

        if (activeIndex === -1) {
          return current;
        }

        next[activeIndex] =
          Math.max(
            0,
            next[activeIndex] -
              nudge
          );

        /*
         * Avoid tiny leftovers.
         */
        if (
          next[activeIndex] < 0.005
        ) {
          next[activeIndex] = 0;
        }

        cardTargetsRef.current = next;

        return next;
      });
    });

    return unsubscribe;
  }, [
    scrollY,
    getSectionState,
  ]);

  /* ==========================================================
   * RESIZE
   * ======================================================== */

  useEffect(() => {
    const handleResize = () => {
      getSectionState();
    };

    window.addEventListener(
      "resize",
      handleResize
    );

    return () => {
      window.removeEventListener(
        "resize",
        handleResize
      );
    };
  }, [getSectionState]);

  return (
    <section
      ref={sectionRef}
      className="
        relative
        bg-[#010213]
        px-4
        pt-12
        pb-24
        sm:px-6
        lg:px-8
      "
    >
      <div >
        <div className="space-y-3 sm:space-y-4">
          {capabilities.map(
            (capability, index) => (
              <CapabilityCard
                key={capability.number}
                capability={capability}
                targetProgress={
                  cardTargets[index]
                }
              />
            )
          )}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
 * CARD
 * ========================================================== */

type CapabilityCardProps = {
  capability: Capability;
  targetProgress: number;
};

function CapabilityCard({
  capability,
  targetProgress,
}: CapabilityCardProps) {
  /*
   * Persistent target.
   */
  const target = useMotionValue(
    targetProgress
  );

  /*
   * Update target whenever scroll state changes.
   */
  useEffect(() => {
    target.set(targetProgress);
  }, [
    target,
    targetProgress,
  ]);

  /*
   * Flow / inertia.
   *
   * This keeps the animation you already liked:
   *
   * scroll
   *   ↓
   * small movement
   *   ↓
   * smooth continuation
   *   ↓
   * settle
   *
   * No bounce.
   */

  const cardProgress = useSpring(
    target,
    {
      stiffness: 90,
      damping: 28,
      mass: 0.6,
    }
  );

  /*
   * Visual follows slightly behind.
   */
  const visualProgress = useSpring(
    cardProgress,
    {
      stiffness: 70,
      damping: 27,
      mass: 0.7,
    }
  );
  /* ==========================================================
   * NATURAL CONTENT MEASUREMENT
   * ======================================================== */

  /*
   * Header + description + pills are measured.
   *
   * Product visual is NOT part of this measurement.
   */
  const naturalContentRef =
    useRef<HTMLDivElement>(null);

  const [
    naturalContentHeight,
    setNaturalContentHeight,
  ] = useState(0);

  useLayoutEffect(() => {
    const element =
      naturalContentRef.current;

    if (!element) {
      return;
    }

    const updateHeight = () => {
      setNaturalContentHeight(
        element.getBoundingClientRect()
          .height
      );
    };

    updateHeight();

    const observer =
      new ResizeObserver(updateHeight);

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [
    capability.description,
    capability.visual,
  ]);

  /*
   * Content height + 30% breathing room + padding.
   */
  const expandedHeight =
    naturalContentHeight > 0
      ? Math.ceil(
          naturalContentHeight *
            EXPANDED_CONTENT_MULTIPLIER +
            CARD_PADDING_Y
        )
      : 200;

  /* ==========================================================
   * CARD APPEARANCE
   * ======================================================== */

  const cardHeight = useTransform(
    cardProgress,
    [0, 1],
    [
      COMPACT_HEIGHT,
      expandedHeight,
    ]
  );

  const backgroundColor =
    useTransform(
      cardProgress,
      [0, 1],
      [
        "rgba(255,255,255,0.018)",
        "rgba(255,255,255,0.045)",
      ]
    );

  const borderColor =
    useTransform(
      cardProgress,
      [0, 1],
      [
        "rgba(255,255,255,0.08)",
        "rgba(255,255,255,0.15)",
      ]
    );

  /* ==========================================================
   * TITLE
   * ======================================================== */

  const titleY = useTransform(
    cardProgress,
    [0, 1],
    [0, -4]
  );

  const titleScale =
    useTransform(
      cardProgress,
      [0, 1],
      [0.96, 1]
    );

  /* ==========================================================
   * DESCRIPTION
   * ======================================================== */

  const descriptionOpacity =
    useTransform(
      cardProgress,
      [0, 0.18, 0.5, 1],
      [0, 0.05, 0.75, 1]
    );

  const descriptionY =
    useTransform(
      cardProgress,
      [0, 1],
      [18, 0]
    );

  /* ==========================================================
   * DETAILS
   * ======================================================== */

  const detailsOpacity =
    useTransform(
      cardProgress,
      [0, 0.35, 0.7, 1],
      [0, 0, 0.65, 1]
    );

  const detailsY =
    useTransform(
      cardProgress,
      [0, 1],
      [14, 0]
    );

  /* ==========================================================
   * VISUAL
   * ======================================================== */

  const visualOpacity =
    useTransform(
      visualProgress,
      [0, 0.15, 0.45, 1],
      [0.02, 0.12, 0.5, 1]
    );

  const visualScale =
    useTransform(
      visualProgress,
      [0, 1],
      [0.72, 1]
    );

  const visualX =
    useTransform(
      visualProgress,
      [0, 1],
      [85, 0]
    );

  return (
    <motion.article
      style={{
        height: cardHeight,
        backgroundColor,
        borderColor,
      }}
      className="
        group
        relative
        overflow-hidden
        rounded-[22px]
        border
        will-change-[height]
      "
    >
      {/* ==================================================== */}
      {/* Ambient glow                                          */}
      {/* ==================================================== */}

      <motion.div
        style={{
          opacity: visualOpacity,
        }}
        className="
          pointer-events-none
          absolute
          inset-0
          bg-[radial-gradient(
            circle_at_78%_48%,
            rgba(86,72,180,0.12),
            transparent_42%
          )]
        "
      />

      {/* ==================================================== */}
      {/* Top edge                                              */}
      {/* ==================================================== */}

      <motion.div
        style={{
          opacity: visualOpacity,
        }}
        className="
          pointer-events-none
          absolute
          inset-x-0
          top-0
          h-px
          bg-gradient-to-r
          from-transparent
          via-white/20
          to-transparent
        "
      />

      {/* ==================================================== */}
      {/* Content                                               */}
      {/* ==================================================== */}

      <div
        className="
          relative
          h-full
          px-6
          py-6
          sm:px-8
          sm:py-7
          lg:px-10
          lg:py-8
        "
      >
        {/* ================================================== */}
        {/* Measured natural content                            */}
        {/* ================================================== */}

        <div
          ref={naturalContentRef}
          className="
            relative
            z-20
          "
        >
          {/* Header */}

          <motion.div
            style={{
              y: titleY,
              scale: titleScale,
              transformOrigin:
                "left center",
            }}
            className="
              flex
              items-start
              justify-between
            "
          >
            <div
              className="
                flex
                min-w-0
                items-center
                gap-4
              "
            >
              <span
                className="
                  shrink-0
                  text-[13px]
                  font-medium
                  tracking-[0.08em]
                  text-white/35
                "
              >
                {capability.number}
              </span>

              <h3
                className="
                  truncate
                  text-[28px]
                  font-medium
                  leading-tight
                  tracking-[-0.035em]
                  text-white
                  sm:text-[32px]
                  lg:text-[38px]
                "
              >
                {capability.title}
              </h3>
            </div>

            <span
              className="
                ml-4
                shrink-0
                pt-1
                text-[15px]
                tracking-wide
                text-white/35
              "
            >
              {capability.number}
            </span>
          </motion.div>

          {/* Description */}

          <motion.div
            style={{
              opacity:
                descriptionOpacity,
              y: descriptionY,
            }}
            className="
              mt-5
              max-w-[540px]
            "
          >
            <p
              className="
                text-[15px]
                leading-6
                tracking-[-0.01em]
                text-white/58
                sm:text-[16px]
                sm:leading-7
              "
            >
              {capability.description}
            </p>

            <motion.div
              style={{
                opacity:
                  detailsOpacity,
                y: detailsY,
              }}
              className="mt-6"
            >
              <CapabilityDetails
                type={capability.visual}
                progress={cardProgress}
              />
            </motion.div>
          </motion.div>
        </div>

        {/* ================================================== */}
        {/* Product visual                                      */}
        {/* ================================================== */}

        <CapabilityVisual
          type={capability.visual}
          opacity={visualOpacity}
          scale={visualScale}
          x={visualX}
          progress={cardProgress}
        />
      </div>
    </motion.article>
  );
}