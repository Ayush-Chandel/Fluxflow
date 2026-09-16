import { motion, useReducedMotion } from "framer-motion";
import { Link, type LinkProps } from "react-router-dom";
import { useState } from "react";
import { cn } from "@/lib/utils";

type FlowingCTAProps = LinkProps & {
  children: React.ReactNode;
};

export default function FlowingCTA({
  children,
  className = "",
  ...props
}: FlowingCTAProps) {
  const shouldReduceMotion = useReducedMotion();
  const [hovered, setHovered] = useState(false);

  const duration = shouldReduceMotion ? 0 : 0.40;
  const ease = [0.76, 0, 0.24, 1] as const;

  return (
    <Link
      {...props}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      /*
        inline-flex (not the <a> default of `inline`) so the white ring is sized
        by the 48px pill inside it, whatever the parent's display is. As an
        inline element this padding/background collapses to line-height and the
        ring leaks out as arcs on either side of the button.
      */
      /*
        The ring is a real 1px border, not a 1px padding gap. Padding leaves the
        ring as the sliver between two independently pixel-snapped rounded
        boxes, so on fractional DPI (125% Windows scaling) it rounds to 1px on
        one edge and 2px on the other. A border paints as a single stroke.
      */
      className={'inline-flex w-fit shrink-0 items-center align-middle border border-white bg-white rounded-full'}
    >
      <div className={cn('relative inline-flex h-12 overflow-hidden rounded-full',className)}>
        {/* =====================================================
          SIZER

          Keeps the outer CTA at its original dimensions.
      ===================================================== */}
      <span
        className="
          invisible
          flex
          h-12
          px-3
          items-center
          justify-center
          text-[15px]
          font-medium
        "
      >
        {children}
      </span>

      {/* =====================================================
          ORIGINAL WHITE CTA

          Moves upward when hovered.
      ===================================================== */}
      <motion.span
        initial={{
          y:'0%'
        }}
        animate={{
          y: hovered ? "-100%" : "0%",
        }}
        transition={{
          duration,
          ease,
        }}
        className="
          absolute
          inset-0
          z-10
          flex
          h-12
          items-center
          justify-center
          rounded-full
          bg-white
          px-3
          text-[15px]
          font-medium
          text-black
        "
      >
        {children}
      </motion.span>

      {/* =====================================================
          RISING BLACK CIRCLE

          This is the actual flowing fill.

          It starts underneath the CTA and rises through
          the center, creating the curved arc at the top.
      ===================================================== */}
      <motion.span
        initial={{
            y:'105%'
          }}
        animate={{
          y: hovered ? "22%" : "105%",
        }}
        transition={{
          duration,
          ease,
        }}
        className="
          pointer-events-none
          absolute
          bottom-0
          left-1/2
          z-20
          aspect-square
          w-[115%]
          -translate-x-1/2
          rounded-[52px]
          bg-[#010213]
        "
      />

      {/* =====================================================
          HOVER TEXT

          Comes up with the black fill.
      ===================================================== */}
      <motion.span
        initial={{
          y:'100%'
        }}
        animate={{
          y: hovered ? "0%" : "100%",
        }}
        transition={{
          duration,
          ease,
        }}
        className="
          pointer-events-none
          absolute
          inset-0
          z-30
          flex
          h-12
          items-center
          justify-center
          px-3
          text-[15px]
          font-medium
          text-white
        "
      >
        {children}
      </motion.span>
      </div>
    </Link>
  );
}