import { useEffect, useRef, useState } from "react";
import {
  animate,
  motion,
  MotionValue,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import { testimonials } from "../common/constants/constants";
import { type Testimonial } from "@/types/landing";
import quoteLogo from '@/assets/quote.svg'
import { QuoteIcon } from "../icons";

/* ======================================================
   DESKTOP POSITIONS
====================================================== */

const DESKTOP_PILE = [
  { x: -245, y: 55, rotate: -9, scale: 0.96 },
  { x: 0, y: -85, rotate: 1, scale: 0.98 },
  { x: 245, y: 45, rotate: 8, scale: 0.96 },
  { x: -105, y: 185, rotate: -14, scale: 0.95 },
  { x: 125, y: 170, rotate: 13, scale: 0.95 },
];

/*
 * Scroll only gives a small visual tease.
 */
const DESKTOP_TEASE = [
  { x: -270, y: 48, rotate: -7, scale: 0.97 },
  { x: 0, y: -72, rotate: 1, scale: 0.985 },
  { x: 270, y: 42, rotate: 6, scale: 0.97 },
  { x: -120, y: 165, rotate: -11, scale: 0.965 },
  { x: 140, y: 155, rotate: 10, scale: 0.965 },
];

/*
 * Final desktop grid.
 *
 * Card size:
 *   350 x 340
 *
 * Horizontal gap:
 *   370 - 350 = 20px
 *
 * Vertical gap:
 *   345 - 340 = 5px
 */
const DESKTOP_GRID = [
  { x: -360, y: -95, rotate: 0, scale: 1 },
  { x: 0, y: -95, rotate: 0, scale: 1 },
  { x: 360, y: -95, rotate: 0, scale: 1 },
  { x: -180, y: 270, rotate: 0, scale: 1 },
  { x: 180, y: 270, rotate: 0, scale: 1 },
];

/* ======================================================
   MOBILE POSITIONS
====================================================== */

const MOBILE_PILE = [
  { x: -48, y: 35, rotate: -6, scale: 0.98 },
  { x: 28, y: -35, rotate: 4, scale: 0.98 },
  { x: -24, y: 18, rotate: -4, scale: 0.97 },
  { x: 42, y: 80, rotate: 6, scale: 0.96 },
  { x: -34, y: 105, rotate: -5, scale: 0.96 },
];

/*
 * Very small mobile scroll tease.
 */
const MOBILE_TEASE = [
  { x: -12, y: 25, rotate: -4, scale: 0.985 },
  { x: 12, y: -25, rotate: 3, scale: 0.985 },
  { x: -10, y: 12, rotate: -3, scale: 0.98 },
  { x: 15, y: 65, rotate: 4, scale: 0.975 },
  { x: -12, y: 85, rotate: -3, scale: 0.975 },
];

/*
 * Final mobile layout.
 *
 * Card height:
 *   340px
 *
 * Vertical gap:
 *   355 - 340 = 15px
 */
const MOBILE_GRID = [
  { x: 0, y: 0, rotate: 0, scale: 1 },
  { x: 0, y: 355, rotate: 0, scale: 1 },
  { x: 0, y: 710, rotate: 0, scale: 1 },
  { x: 0, y: 1065, rotate: 0, scale: 1 },
  { x: 0, y: 1420, rotate: 0, scale: 1 },
];


/* ======================================================
   EASING
====================================================== */

export const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

/* ======================================================
   COMPANY MARK
====================================================== */

function CompanyMark({
  company,
  description,
}: {
  company: string;
  description: string;
}) {
  return (
    <div className="mt-auto border-t border-white/[0.09] pt-5">
      <div className="text-[18px] font-semibold tracking-[-0.05em] text-white">
        {company}
      </div>

      <div className="mt-1 text-[9px] uppercase tracking-[0.18em] text-white/40">
        {description}
      </div>
    </div>
  );
}

/* ======================================================
   TESTIMONIAL CARD
====================================================== */

type TestimonialCardProps = {
  testimonial: Testimonial;
  index: number;
  progress: MotionValue<number>;
  hovered: boolean;
  isMobile: boolean;
};

export function TestimonialCard({
  testimonial,
  index,
  progress,
  hovered,
  isMobile,
}: TestimonialCardProps) {
  const reduceMotion = useReducedMotion();

  const pile = isMobile ? MOBILE_PILE : DESKTOP_PILE;
  const tease = isMobile ? MOBILE_TEASE : DESKTOP_TEASE;
  const grid = isMobile ? MOBILE_GRID : DESKTOP_GRID;

  /* ----------------------------------------------------
     SCROLL-BASED TEASE

     Scroll only:
       PILE → TEASE

     It never reaches GRID.
  ---------------------------------------------------- */

  const scrollX = useTransform(
    progress,
    [0, 0.55, 1],
    [pile[index].x, tease[index].x, tease[index].x],
    {
      ease: easeOutCubic,
    }
  );

  const scrollY = useTransform(
    progress,
    [0, 0.55, 1],
    [pile[index].y, tease[index].y, tease[index].y],
    {
      ease: easeOutCubic,
    }
  );

  const scrollRotate = useTransform(
    progress,
    [0, 0.55, 1],
    [pile[index].rotate, tease[index].rotate, tease[index].rotate],
    {
      ease: easeOutCubic,
    }
  );

  const scrollScale = useTransform(
    progress,
    [0, 0.55, 1],
    [pile[index].scale, tease[index].scale, tease[index].scale],
    {
      ease: easeOutCubic,
    }
  );

  /* ----------------------------------------------------
     HOVER PROGRESS

     0 = tease
     1 = final grid
  ---------------------------------------------------- */

  const hoverProgress = useMotionValue(hovered ? 1 : 0);

  useEffect(() => {
    const controls = animate(hoverProgress, hovered ? 1 : 0, {
      duration: 0.38,
      ease: [0.22, 1, 0.36, 1],
    });

    return () => {
      controls.stop();
    };
  }, [hovered, hoverProgress]);

  /* ----------------------------------------------------
     TEASE → GRID
  ---------------------------------------------------- */

  const targetX = useTransform(
    [scrollX, hoverProgress],
    ([currentX, hover]) => {
      const x = Number(currentX);
      const h = Number(hover);

      return x + (grid[index].x - x) * h;
    }
  );

  const targetY = useTransform(
    [scrollY, hoverProgress],
    ([currentY, hover]) => {
      const y = Number(currentY);
      const h = Number(hover);

      return y + (grid[index].y - y) * h;
    }
  );

  const targetRotate = useTransform(
    [scrollRotate, hoverProgress],
    ([currentRotate, hover]) => {
      const rotation = Number(currentRotate);
      const h = Number(hover);

      return rotation + (grid[index].rotate - rotation) * h;
    }
  );

  const targetScale = useTransform(
    [scrollScale, hoverProgress],
    ([currentScale, hover]) => {
      const current = Number(currentScale);
      const h = Number(hover);

      return current + (grid[index].scale - current) * h;
    }
  );

  /* ----------------------------------------------------
     CARD THEME
  ---------------------------------------------------- */

  const cardTheme =
    testimonial.tone === "cyan"
      ? `
        bg-[linear-gradient(
          145deg,
          rgba(18,48,60,0.94),
          rgba(8,14,28,0.97) 48%,
          rgba(3,7,20,0.99)
        )]
        border-cyan-300/[0.14]
      `
      : `
        bg-[linear-gradient(
          145deg,
          rgba(35,28,64,0.94),
          rgba(10,12,29,0.97) 48%,
          rgba(3,7,20,0.99)
        )]
        border-violet-300/[0.14]
      `;

  const accentColor =
    testimonial.tone === "cyan"
      ? {
          line: "via-cyan-200/25",
          glow: "bg-cyan-400/[0.045]",
        }
      : {
          line: "via-violet-200/25",
          glow: "bg-violet-400/[0.05]",
        };

  return (
    <motion.article
      style={{
        x: reduceMotion ? grid[index].x : targetX,
        y: reduceMotion ? grid[index].y : targetY,
        rotate: reduceMotion ? 0 : targetRotate,
        scale: reduceMotion ? 1 : targetScale,

        /*
         * Keep the original stack depth permanently.
         *
         * Card 1 > 2 > 3 > 4 > 5.
         */
        zIndex: testimonials.length - index,
      }}
      className={`
        absolute
        left-1/2
        top-0
        h-[340px]
        w-[calc(100vw-32px)]
        max-w-[350px]
        -translate-x-1/2
        overflow-hidden
        rounded-[4px]
        border
        p-7
        backdrop-blur-sm
        shadow-[0_24px_80px_rgba(0,0,0,0.38),inset_0_1px_0_rgba(255,255,255,0.045)]
        ${cardTheme}
      `}
    >
      {/* ==================================================
          TOP HIGHLIGHT
      ================================================== */}

      <div
        className={`
          pointer-events-none
          absolute
          inset-x-0
          top-0
          h-px
          bg-gradient-to-r
          from-transparent
          ${accentColor.line}
          to-transparent
        `}
      />

      {/* ==================================================
          SUBTLE CORNER LIGHT
      ================================================== */}

      <div
        className={`
          pointer-events-none
          absolute
          -right-16
          -top-16
          h-32
          w-32
          rounded-full
          blur-3xl
          ${accentColor.glow}
        `}
      />

      {/* ==================================================
          CONTENT
      ================================================== */}

      <div className="relative flex h-full flex-col">
        {/* <QuoteMark /> */}
        <QuoteIcon color="white" size={32}/>

        <p className="text-[14px] leading-[1.68] tracking-[-0.01em] text-white/85 pt-2">
          “{testimonial.quote}”
        </p>

        <CompanyMark
          company={testimonial.company}
          description={testimonial.description}
        />
      </div>
    </motion.article>
  );
}
