import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { CursorType } from "@/types/landing";

export type HoverTextSwapProps = {
  text: string;
  hoverText?: string;
  active?: boolean;
  className?: string;
  duration?: number;
  dataCursor?:CursorType
};

const EASE = [0.22, 1, 0.36, 1] as const;

export default function HoverTextSwap({
  text,
  hoverText,
  active,
  className,
  dataCursor,
  duration = 0.32,
}: HoverTextSwapProps) {
  const prefersReducedMotion = useReducedMotion();

  const transition = {
    duration: prefersReducedMotion ? 0 : duration,
    ease: EASE,
  };

  const contentVariants = {
    rest: {
      y: "0%",
    },
    hover: {
      y: "-100%",
      transition,
    },
  };

  const incomingVariants = {
    rest: {
      y: "100%",
    },
    hover: {
      y: "0%",
      transition,
    },
  };

  return (
    <motion.span
      className={cn(
        "relative inline-grid overflow-hidden align-middle",
        className
      )}
      data-cursor={dataCursor}
      initial="rest"
      animate={active === undefined ? undefined : active ? "hover" : "rest"}
      whileHover={active === undefined ? "hover" : undefined}
      whileFocus={active === undefined ? "hover" : undefined}
    >
      {/* Current text */}
      <motion.span
        className="col-start-1 row-start-1 whitespace-nowrap"
        variants={contentVariants}
      >
        {text}
      </motion.span>

      {/* Incoming text */}
      <motion.span
        aria-hidden="true"
        className="col-start-1 row-start-1 whitespace-nowrap"
        variants={incomingVariants}
      >
        {hoverText ? hoverText : text}
      </motion.span>
    </motion.span>
  );
}