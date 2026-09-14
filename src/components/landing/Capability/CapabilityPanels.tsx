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

const SCROLL_TO_PROGRESS = 0.0035;

const MAX_PROGRESS_PER_UPDATE = 0.4;

const COMPLETION_THRESHOLD = 0.995;

const ACTIVATION_TOP = 0.72;
const ACTIVATION_BOTTOM = 0.72;

/* ============================================================
 * CARD LAYOUT
 * ========================================================== */

const COMPACT_HEIGHT = 118;

const EXPANDED_CONTENT_MULTIPLIER = 1.3;

/*
 * py-6 = 24px top + 24px bottom
 */
const CARD_PADDING_Y = 48;

/*
 * space-y-4 / gap-4 = 16px
 */
const CARD_GAP = 16;

/*
 * Vertical breathing room around the whole stack.
 *
 * The Capability section itself has:
 *
 * pt-12 = 48px
 * pb-24 = 96px
 *
 * Total = 144px
 */
const SECTION_VERTICAL_PADDING = 144;

/* ============================================================
 * CAPABILITY PANELS
 * ========================================================== */

export default function CapabilityPanels() {
  const sectionRef = useRef<HTMLElement>(null);

  /*
   * Persistent target progress for each card.
   */
  const [cardTargets, setCardTargets] = useState<number[]>(
    () => capabilities.map(() => 0)
  );

  /*
   * Expanded heights reported by each card.
   *
   * Example:
   *
   * [250, 290, 235]
   */
  const [expandedHeights, setExpandedHeights] = useState<number[]>(
    () => capabilities.map(() => 0)
  );

  /*
   * Keep target values outside React as well.
   */
  const cardTargetsRef = useRef<number[]>(
    capabilities.map(() => 0)
  );

  const { scrollY } = useScroll();

  const lastScrollY = useRef<number | null>(null);

  const sectionActiveRef = useRef(false);

  const sectionStartedRef = useRef(false);

  /* ==========================================================
   * EXPANDED STACK HEIGHT
   * ======================================================== */

  /*
   * Once all cards have reported their natural expanded height,
   * reserve enough space for the entire eventual stack.
   *
   * This prevents later card expansion from pushing anything
   * below the section downward.
   */
  const measuredHeightComplete =
    expandedHeights.every(
      (height) => height > 0
    );

  const measuredCardsHeight =
    expandedHeights.reduce(
      (sum, height) => sum + height,
      0
    );

  const totalCardsHeight =
    measuredCardsHeight +
    Math.max(
      0,
      capabilities.length - 1
    ) *
      CARD_GAP;

  const reservedSectionHeight =
    totalCardsHeight +
    SECTION_VERTICAL_PADDING;

  /*
   * Fallback used only during the first render before the cards
   * have measured themselves.
   *
   * It is deliberately conservative so the section doesn't
   * visually jump when measurements arrive.
   */
  const fallbackSectionHeight = 900;

  /* ==========================================================
   * RECEIVE CARD HEIGHT
   * ======================================================== */

  const handleExpandedHeight = useCallback(
    (index: number, height: number) => {
      setExpandedHeights((current) => {
        if (current[index] === height) {
          return current;
        }

        const next = [...current];

        next[index] = height;

        return next;
      });
    },
    []
  );

  /* ==========================================================
   * SECTION STATE
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

    const passedDown =
      rect.bottom <
      viewportHeight * ACTIVATION_BOTTOM;

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
       * DOWN
       * ==================================================== */

      if (delta > 0) {
        if (active) {
          sectionStartedRef.current = true;
        }

        /*
         * IMPORTANT:
         *
         * If the user flies past the section, finish all card
         * targets in the background.
         *
         * This prevents the last card from being left half-open.
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
           * Only the first incomplete card receives the
           * scroll movement.
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
       * UP
       * ==================================================== */

      /*
       * Fast upward jump past the whole section:
       *
       * collapse everything in the background.
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
         * Collapse the last card first.
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

  /* ==========================================================
   * RENDER
   * ======================================================== */

  return (
    <section
      ref={sectionRef}
      style={{
        /*
         * Once measurements are available, reserve the entire
         * eventual stack height.
         */
        minHeight: measuredHeightComplete
          ? reservedSectionHeight
          : fallbackSectionHeight,
      }}
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
      <div>
        <div className="space-y-3 sm:space-y-4">
          {capabilities.map(
            (capability, index) => (
              <CapabilityCard
                key={capability.number}
                capability={capability}
                targetProgress={
                  cardTargets[index]
                }
                onExpandedHeight={
                  handleExpandedHeight
                }
                index={index}
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
  index: number;
  onExpandedHeight: (
    index: number,
    height: number
  ) => void;
};

function CapabilityCard({
  capability,
  targetProgress,
  index,
  onExpandedHeight,
}: CapabilityCardProps) {
  /*
   * Persistent target.
   */
  const target = useMotionValue(
    targetProgress
  );

  useEffect(() => {
    target.set(targetProgress);
  }, [
    target,
    targetProgress,
  ]);

  /*
   * Existing flow/inertia behavior.
   *
   * Kept intentionally unchanged.
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
      const height =
        element.getBoundingClientRect()
          .height;

      setNaturalContentHeight(height);

      /*
       * Report the final card height to
       * CapabilityPanels.
       */
      const expandedHeight =
        Math.ceil(
          height *
            EXPANDED_CONTENT_MULTIPLIER +
            CARD_PADDING_Y
        );

      onExpandedHeight(
        index,
        expandedHeight
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
    index,
    onExpandedHeight,
  ]);

  /*
   * Expanded height derived from actual content.
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
   * CARD HEIGHT
   * ======================================================== */

  const cardHeight = useTransform(
    cardProgress,
    [0, 1],
    [
      COMPACT_HEIGHT,
      expandedHeight,
    ]
  );

  /* ==========================================================
   * CARD APPEARANCE
   * ======================================================== */

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

  const titleY =
    useTransform(
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
        {/* Natural content                                     */}
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