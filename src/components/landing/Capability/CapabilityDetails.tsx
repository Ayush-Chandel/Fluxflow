import {
  useRef,
  useState,
} from "react";

import type { Capability } from "@/types/landing";

import {
  motion,
  useMotionValueEvent,
} from "framer-motion";

import type { MotionValue } from "framer-motion";

export function CapabilityDetails({
  type,
  progress,
}: {
  type: Capability["visual"];
  progress: MotionValue<number>;
}) {
  const [visible, setVisible] = useState(
    progress.get() > 0.55
  );

  const visibleRef = useRef(visible);

  const setVisibility = (next: boolean) => {
    visibleRef.current = next;
    setVisible(next);
  };

  useMotionValueEvent(
    progress,
    "change",
    (latest) => {
      if (
        latest >= 0.55 &&
        !visibleRef.current
      ) {
        setVisibility(true);
      }

      if (
        latest < 0.2 &&
        visibleRef.current
      ) {
        setVisibility(false);
      }
    }
  );

  const content =
    type === "planning"
      ? [
          "Structured plans",
          "Team alignment",
          "Measurable progress",
        ]
      : type === "automation"
        ? [
            "Workflow builder",
            "AI agents",
            "Connected tools",
          ]
        : [
            "Context aware",
            "Generate faster",
            "Work alongside AI",
          ];

  return (
    <motion.div
      initial={false}
      animate={{
        opacity: visible ? 1 : 0,
        y: visible ? 0 : 12,
      }}
      transition={{
        duration: 0.45,
        delay: visible ? 0.3 : 0,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="
        flex
        flex-wrap
        gap-2
      "
    >
      {content.map((item) => (
        <span
          key={item}
          className="
            rounded-full
            border
            border-white/10
            bg-white/[0.025]
            px-4
            py-2
            text-xs
            text-white/50
            backdrop-blur-sm
          "
        >
          {item}
        </span>
      ))}
    </motion.div>
  );
}