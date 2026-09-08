import type { flowCards } from "@/components/common/constants/constants";
import type { useScroll } from "motion/react";

export type FlowCardProps = {
  card: (typeof flowCards)[number];
  index: number;
  progress: ReturnType<typeof useScroll>["scrollYProgress"];
  reducedMotion: boolean;
};