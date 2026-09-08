import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "motion/react";
import { useLayoutEffect, useRef, useState } from "react";
import { flowCards } from "../common/constants/constants";
import FlowCard from "./FlowCard";


export default function HorizontalFlow() {
  const sectionRef = useRef<HTMLElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);

  const reducedMotion = useReducedMotion() ?? false;

  const [railPosition, setRailPosition] = useState({
    start: 0,
    end: 0,
  });

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  /**
   * Measure the actual amount of horizontal travel.
   */
  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    const rail = railRef.current;

    if (!viewport || !rail) return;

    const measureRail = () => {
      const viewportWidth = viewport.clientWidth;
      const railWidth = rail.scrollWidth;

      const inset = Math.max(
        32,
        viewportWidth * 0.08
      );

      const start = inset;

      const maxTravel = Math.max(
        0,
        railWidth - viewportWidth + inset * 2
      );

      const end = start - maxTravel;

      setRailPosition((previous) => {
        if (
          previous.start === start &&
          previous.end === end
        ) {
          return previous;
        }

        return {
          start,
          end,
        };
      });
    };

    measureRail();

    const resizeObserver = new ResizeObserver(measureRail);

    resizeObserver.observe(viewport);
    resizeObserver.observe(rail);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  const delayedProgress = useTransform(
  scrollYProgress,
  [0, 0.3, 1],
  [0, 0, 1]
  );

  const rawRailX = useTransform(
  delayedProgress,
  [0, 1],
  [railPosition.start, railPosition.end]
  );

  /**
   * Smooth the movement slightly so the cards have
   * a physical feel rather than perfectly tracking
   * every tiny scroll fluctuation.
   */
  const smoothRailX = useSpring(rawRailX, {
    stiffness: 90,
    damping: 24,
    mass: 0.35,
  });

  const railX = reducedMotion ? 0 : smoothRailX;

  return (
    <section
      ref={sectionRef}
      aria-labelledby="flow-heading"
      className="relative bg-[#010213] text-white"
    >
      {/* ------------------------------------------------
          INTRO
      ------------------------------------------------ */}
      <div className="mx-auto max-w-7xl px-6 pb-20 pt-28 sm:px-10 sm:pt-36">
        <div className="max-w-2xl">
          <p className="mb-5 text-sm font-medium uppercase tracking-[0.2em] text-cyan-300/70">
            One connected workflow
          </p>

          <h2
            id="flow-heading"
            className="text-4xl font-medium tracking-tight text-white sm:text-6xl"
          >
            From first thought to finished work.
          </h2>

          <p className="mt-6 max-w-xl text-lg leading-8 text-white/55">
            FluxFlow keeps the whole product system moving
            in one clear direction, from shaping the work to
            learning from it.
          </p>
        </div>
      </div>

      {/* ------------------------------------------------
          DESKTOP
      ------------------------------------------------ */}
      <div className="hidden h-[285vh] lg:block">
        <div
          ref={viewportRef}
          className="
            sticky
            top-0
            flex
            h-screen
            items-center
            overflow-hidden
          "
        >
          
          {/* Horizontal rail */}
          <motion.div
            ref={railRef}
            className="
              flex
              w-max
              gap-6
              will-change-transform
              xl:gap-8
            "
            style={{
              x: railX,
            }}
          >
            {flowCards.map((card, index) => (
              <FlowCard
                key={card.title}
                card={card}
                index={index}
                progress={delayedProgress}
                reducedMotion={reducedMotion}
              />
            ))}
          </motion.div>
        </div>
      </div>

      {/* ------------------------------------------------
          MOBILE
      ------------------------------------------------ */}
      <div className="space-y-4 px-6 pb-28 lg:hidden sm:px-10">
        {flowCards.map((card) => (
          <article
            key={card.title}
            className="
              flex
              min-h-64
              flex-col
              justify-between
              rounded-[1.5rem]
              border
              border-white/10
              bg-white/[0.035]
              p-6
            "
          >
            <div
              className={`h-1.5 w-14 rounded-full ${card.accent}`}
            />

            <div>
              <p className="mb-3 text-sm font-medium tracking-[0.18em] text-white/40">
                {card.number}
              </p>

              <h3 className="text-3xl font-medium tracking-tight text-white">
                {card.title}
              </h3>

              <p className="mt-4 max-w-lg leading-7 text-white/55">
                {card.description}
              </p>
            </div>

            <p className="mt-6 text-xs font-medium uppercase tracking-[0.16em] text-white/30">
              {card.eyebrow}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}