import type { flowCards } from "@/components/common/constants/constants";
import type { useScroll } from "motion/react";
import type { ReactNode } from "react";

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

export type CursorType =
  | "default"
  | "link"
  | "cta" 
  | "description"
  | "heading";

export type CursorState = {
  type: CursorType;
  label: string;
};

export type RevealMode = "load" | "viewport";
export type SplitMode = "none" | "words" | "lines";
export type RevealAnimation = "transform" | "clip";

export interface TextRevealProps {
  children?: ReactNode;

  mode?: RevealMode;
  split?: SplitMode;
  lines?: ReactNode[];

  delay?: number;
  stagger?: number;
  duration?: number;

  y?: number | string;
  opacity?: boolean;

  amount?: number;
  once?: boolean;

  className?: string;
  dataCursor?: CursorType;
  id?:string;
  parentClassname?:string
  animation?: RevealAnimation;
}
