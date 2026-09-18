import {
  motion,
  useInView,
  useReducedMotion,
} from "framer-motion";
import { useRef } from "react";
import { cn } from "@/lib/utils";
import type { TextRevealProps } from "@/types/landing";

export default function TextReveal({
  children,
  mode = "viewport",
  split = "none",
  lines = [],

  delay = 0,
  stagger = 0.06,
  duration = 0.75,

  y = "100%",
  opacity = false,

  amount = 0.35,
  once = true,

  className = "",
  dataCursor = 'default',
  id = '',
  parentClassname=''
}: TextRevealProps) {
  const shouldReduceMotion = useReducedMotion();

  /*
   * One ref for the whole reveal.
   */
  const ref = useRef<HTMLDivElement>(null);

  const inView = useInView(ref, {
    amount,
    once,
  });

  const visible =
    mode === "load" || inView;

  const actualDuration = shouldReduceMotion
    ? 0
    : duration;

  /*
   * --------------------------------------------------
   * SINGLE BLOCK
   * --------------------------------------------------
   */

 if (split === "none") {
  return (
    <div
      ref={ref}
      className="overflow-hidden"
    >
      <motion.div
        id={id}
        className={className}
        initial={{
          y,
          ...(opacity ? { opacity: 0 } : {}),
        }}
        animate={{
          y: visible ? 0 : y,
          ...(opacity
            ? {
                opacity: visible ? 1 : 0,
              }
            : {}),
        }}
        transition={{
          duration: actualDuration,
          delay: visible ? delay : 0,
          ease: [0.22, 1, 0.36, 1],
        }}
        data-cursor={dataCursor}
      >
        {children}
      </motion.div>
    </div>
  );
 }

  /*
   * --------------------------------------------------
   * WORDS
   * --------------------------------------------------
   */

 if (split === "words") {
  const text =
    typeof children === "string"
      ? children
      : "";

  const words = text.split(" ");

  return (
    <div ref={ref} id={id} >
      <span className={cn("inline-flex flex-wrap",parentClassname)}>
        {words.map((word, index) => (
          <span
            key={`${word}-${index}`}
            className="mr-[0.25em] inline-block overflow-hidden"
          >
            <motion.span
              className={`inline-block ${className}`}
              data-cursor={dataCursor}
              initial={{
                y: "100%",
                ...(opacity ? { opacity: 0 } : {}),
              }}
              animate={{
                y: visible ? "0%" : "100%",
                ...(opacity
                  ? {
                      opacity: visible ? 1 : 0,
                    }
                  : {}),
              }}
              transition={{
                duration: actualDuration,
                delay: visible
                  ? delay + index * stagger
                  : 0,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              {word}
            </motion.span>
          </span>
        ))}
      </span>
    </div>
  );
}

  /*
   * --------------------------------------------------
   * LINES
   * --------------------------------------------------
   */

  return (
    <div
      id={id}
      ref={ref}
      className={className}
    >
      {lines.map((line, index) => (
        <span
          key={index}
          className="block overflow-hidden"
        >
          <motion.span
            className="block"
            data-cursor={dataCursor}
            initial={{
              y,
              ...(opacity
                ? { opacity: 0 }
                : {}),
            }}
            animate={{
              y: visible ? 0 : y,
              ...(opacity
                ? {
                    opacity: visible ? 1 : 0,
                  }
                : {}),
            }}
            transition={{
              duration: actualDuration,
              delay: visible
                ? delay + index * stagger
                : 0,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            {line}
          </motion.span>
        </span>
      ))}
    </div>
  );
}