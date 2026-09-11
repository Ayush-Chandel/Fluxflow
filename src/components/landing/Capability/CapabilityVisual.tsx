import type { Capability } from "@/types/landing";
import { motion } from "framer-motion";
import type { MotionValue } from "framer-motion";

import { PlanningVisual } from "./PlanningVisual";
import { AutomationVisual } from "./AutomationVisual";
import { AIVisual } from "./AIVisual";

type CapabilityVisualProps = {
  type: Capability["visual"];
  opacity: MotionValue<number>;
  scale: MotionValue<number>;
  x: MotionValue<number>;
  progress: MotionValue<number>;
};

export function CapabilityVisual({
  type,
  opacity,
  scale,
  x,
}: CapabilityVisualProps) {
  return (
    <motion.div
      style={{
        opacity,
        scale,
        x,
      }}
      className="
        pointer-events-none
        absolute
        inset-y-0
        right-[-5%]
        hidden
        w-[56%]
        lg:block
      "
    >
      {type === "planning" && (
        <PlanningVisual />
      )}

      {type === "automation" && (
        <AutomationVisual />
      )}

      {type === "ai" && (
        <AIVisual />
      )}
    </motion.div>
  );
}