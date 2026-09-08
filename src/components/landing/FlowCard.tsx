import type { FlowCardProps } from "@/types/landing";
import { flowCards } from "../common/constants/constants";
import { useTransform } from "motion/react";
import {motion} from "motion/react";

const CARD_COUNT = flowCards.length;


function FlowCard({
  card,
  index,
  progress,
  reducedMotion,
}: FlowCardProps) {
  const focusPoint = index / (CARD_COUNT - 1);

  const focusRange = 0.22;

  const scale = useTransform(progress, (value) => {
    if (reducedMotion) return 1;

    const distance = Math.abs(value - focusPoint);

    const normalized = Math.max(
      0,
      1 - distance / focusRange
    );

    return 0.9 + normalized * 0.1;
  });

  const opacity = useTransform(progress, (value) => {
    if (reducedMotion) return 1;

    const distance = Math.abs(value - focusPoint);

    const normalized = Math.max(
      0,
      1 - distance / focusRange
    );

    return 0.55 + normalized * 0.45;
  });

  return (
    <motion.article
      style={{
        scale,
        opacity,
      }}
      className="
        group
        relative
        flex
        min-h-[28rem]
        w-[min(72vw,34rem)]
        flex-none
        flex-col
        justify-between
        overflow-hidden
        rounded-[1.75rem]
        border
        border-white/10
        bg-white/[0.035]
        p-7
        shadow-2xl
        shadow-black/20
        sm:p-9
      "
    >
      <div
        className={`h-1.5 w-16 rounded-full ${card.accent}`}
      />

      <div className="relative z-10">
        <p className="mb-4 text-sm font-medium tracking-[0.18em] text-white/40">
          {card.number}
        </p>

        <h3 className="text-4xl font-medium tracking-tight text-white sm:text-5xl">
          {card.title}
        </h3>

        <p className="mt-5 max-w-sm text-base leading-7 text-white/55 sm:text-lg">
          {card.description}
        </p>
      </div>

      <p className="relative z-10 text-sm font-medium uppercase tracking-[0.16em] text-white/35">
        {card.eyebrow}
      </p>

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          inset-0
          opacity-0
          transition-opacity
          duration-700
          group-hover:opacity-100
          [background:radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.07),transparent_42%)]
        "
      />
    </motion.article>
  );
}

export default FlowCard