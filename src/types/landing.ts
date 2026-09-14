import type { flowCards } from "@/components/common/constants/constants";
import type { useScroll } from "motion/react";

export type FlowCardProps = {
  card: (typeof flowCards)[number];
  index: number;
  progress: ReturnType<typeof useScroll>["scrollYProgress"];
  reducedMotion: boolean;
};


export type Capability = {
  number: string;
  title: string;
  description: string;
  visual: "planning" | "automation" | "ai";
};

export type Testimonial = {
  quote: string;
  company: string;
  description: string;
  tone: "cyan" | "violet";
};
