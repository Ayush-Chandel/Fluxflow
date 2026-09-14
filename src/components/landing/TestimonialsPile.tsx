import { useEffect, useRef, useState } from "react";
import { useScroll, useSpring, useTransform } from "framer-motion";
import { easeOutCubic, TestimonialCard } from "./TestimonialsCard";
import { testimonials } from "../common/constants/constants";
import TextReveal from "../common/TextReveal";

/* ======================================================
   RESPONSIVE HOOK
====================================================== */

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 767px)");

    const update = () => {
      setIsMobile(mediaQuery.matches);
    };

    update();

    mediaQuery.addEventListener("change", update);

    return () => {
      mediaQuery.removeEventListener("change", update);
    };
  }, []);

  return isMobile;
}

/* ======================================================
   HOVER SUPPORT
====================================================== */

function useCanHover() {
  const [canHover, setCanHover] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(hover: hover) and (pointer: fine)");

    const update = () => {
      setCanHover(mediaQuery.matches);
    };

    update();

    mediaQuery.addEventListener("change", update);

    return () => {
      mediaQuery.removeEventListener("change", update);
    };
  }, []);

  return canHover;
}

/* ======================================================
   MAIN COMPONENT
====================================================== */

export default function TestimonialsPile() {
  const sectionRef = useRef<HTMLElement>(null);

  const [hovered, setHovered] = useState(false);

  const isMobile = useIsMobile();
  const canHover = useCanHover();

  /* ----------------------------------------------------
     SCROLL TRACKING
  ---------------------------------------------------- */

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start 82%", "end 18%"],
  });

  /*
   * Smooth browser scroll.
   */
  const progress = useSpring(scrollYProgress, {
    stiffness: 70,
    damping: 24,
    mass: 0.8,
  });

  /*
   * Scroll choreography:
   *
   * 0.00 → 0.20
   *   pile stays still
   *
   * 0.20 → 0.55
   *   subtle tease
   *
   * 0.55 → 1.00
   *   remain at tease
   *
   * The final grid is reached ONLY on hover.
   */
  const mappedProgress = useTransform(
    progress,
    [0, 0.2, 0.55, 1],
    [0, 0, 0.55, 1],
    {
      ease: easeOutCubic,
    },
  );

  return (
    <section
      ref={sectionRef}
      className={`
        relative
        overflow-hidden
        bg-[#010213]
        py-16
        sm:py-36
        ${isMobile ? "min-h-[1750px]" : "min-h-[900px]"}
      `}
    >
      <div className="mx-auto max-w-[1200px] px-6">
        {/* =================================================
            HEADING
        ================================================= */}

        <div className="mx-auto mb-16 max-w-[720px] text-center sm:mb-30">
          <p
            className="mb-5 text-[10px] font-medium uppercase tracking-[0.25em] text-cyan-300/70 sm:text-[11px]"
            data-cursor="link"
          >
            Teams moving forward
          </p>

          <TextReveal
            mode="viewport"
            split="lines"
            stagger={0.08}
            duration={0.8}
            lines={["One place to turn", "ideas into momentum."]}
            className="text-balance text-4xl font-medium tracking-[-0.055em] text-white sm:text-5xl md:text-6xl"
            data-cursor="heading"
          />
          <TextReveal
            mode="viewport"
            split="words"
            duration={0.8}
            stagger={0.01}
            delay={0.5}
            className=" text-[15px] leading-7 text-white/40 sm:text-lg"
            data-cursor="description"
            parentClassname="mx-auto mt-6 max-w-[590px] justify-center"
          >
            FluxFlow brings your people, plans, context, and AI agents together
            so work can move without the usual friction.
          </TextReveal>
        </div>

        {/* =================================================
            TESTIMONIAL STAGE
        ================================================= */}

        <div
          className={`
            relative
            mx-auto
            w-full
            max-w-[1050px]
            ${isMobile ? "h-[1760px]" : "h-[680px]"}
          `}
          onMouseEnter={() => {
            if (canHover) {
              setHovered(true);
            }
          }}
          onMouseLeave={() => {
            if (canHover) {
              setHovered(false);
            }
          }}
        >
          {/* =================================================
              AMBIENT GLOW
          ================================================= */}

          <div
            className={`
              pointer-events-none
              absolute
              left-1/2
              top-1/2
              -translate-x-1/2
              -translate-y-1/2
              rounded-full
              bg-violet-500/[0.035]
              blur-[120px]
              ${isMobile ? "h-[600px] w-[340px]" : "h-[480px] w-[760px]"}
            `}
          />

          {/* =================================================
              CARD STAGE
          ================================================= */}

          <div
            className={`
              absolute
              left-1/2
              top-4
              w-[350px]
              -translate-x-1/2
              ${isMobile ? "h-[1760px]" : "h-[600px]"}
            `}
          >
            {testimonials.map((testimonial, index) => (
              <TestimonialCard
                key={testimonial.company}
                testimonial={testimonial}
                index={index}
                progress={mappedProgress}
                hovered={canHover ? hovered : false}
                isMobile={isMobile}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
