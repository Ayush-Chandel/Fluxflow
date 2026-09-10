import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import { useRef } from "react";
import HighlightTimelineBg from "./HighlightTimelineBg";

function HighlightTimeline() {
  const sectionRef = useRef<HTMLElement>(null);
  const shouldReduceMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  /*
   * ================================================================
   * CINEMATIC DARK → WASHED TRANSITION
   * ================================================================
   *
   * The scene starts dark.
   *
   * Near the end, we reduce the darkness slightly so the image feels
   * more washed/lifted.
   */

  const darkOverlayOpacity = useTransform(
    scrollYProgress,
    [0, 0.68, 0.82, 1],
    [0.42, 0.42, 0.28, 0.18]
  );

  /*
   * Very subtle desaturated/washed layer near the end.
   */
  const washedOverlayOpacity = useTransform(
    scrollYProgress,
    [0.68, 0.82, 1],
    [0, 0.04, 0.12]
  );

  /*
   * Slightly lift the lower contrast toward the end.
   * Still stays within the dark cinematic look.
   */
  const finalGlowOpacity = useTransform(
    scrollYProgress,
    [0.72, 0.88, 1],
    [0, 0.06, 0.1]
  );

  /*
   * ================================================================
   * STATEMENT 1
   * ================================================================
   */

  const statement1Y = useTransform(
    scrollYProgress,
    [0, 0.08, 0.19, 0.28],
    [110, 0, -24, -70]
  );

  const statement1Opacity = useTransform(
    scrollYProgress,
    [0.015, 0.07, 0.19, 0.255, 0.31],
    [0, 1, 1, 0.25, 0]
  );

  const statement1Scale = useTransform(
    scrollYProgress,
    [0.04, 0.1, 0.22, 0.29],
    [0.975, 1, 1, 0.985]
  );

  /*
   * ================================================================
   * STATEMENT 2
   * ================================================================
   */

  const statement2Y = useTransform(
    scrollYProgress,
    [0.26, 0.34, 0.46, 0.55],
    [100, 0, -22, -68]
  );

  const statement2Opacity = useTransform(
    scrollYProgress,
    [0.27, 0.34, 0.46, 0.53, 0.58],
    [0, 1, 1, 0.25, 0]
  );

  const statement2Scale = useTransform(
    scrollYProgress,
    [0.3, 0.37, 0.49, 0.56],
    [0.975, 1, 1, 0.985]
  );

  /*
   * ================================================================
   * STATEMENT 3
   * ================================================================
   */

  const statement3Y = useTransform(
    scrollYProgress,
    [0.53, 0.61, 0.72, 0.83],
    [100, 0, -20, -55]
  );

  const statement3Opacity = useTransform(
    scrollYProgress,
    [0.54, 0.62, 0.74, 0.87, 0.94],
    [0, 1, 1, 0.8, 0]
  );

  const statement3Scale = useTransform(
    scrollYProgress,
    [0.57, 0.64, 0.76, 0.84],
    [0.975, 1, 1, 0.99]
  );

  /*
   * ================================================================
   * EYEBROWS
   * ================================================================
   */

  const eyebrow1Opacity = useTransform(
    scrollYProgress,
    [0.015, 0.07, 0.24, 0.29],
    [0, 1, 1, 0]
  );

  const eyebrow2Opacity = useTransform(
    scrollYProgress,
    [0.27, 0.34, 0.48, 0.56],
    [0, 1, 1, 0]
  );

  const eyebrow3Opacity = useTransform(
    scrollYProgress,
    [0.54, 0.62, 0.76, 0.88],
    [0, 1, 1, 0]
  );

  return (
    <section
      ref={sectionRef}
      className="
        relative
        h-[380vh]
        bg-[#010213]
        pt-30
      "
    >
      {/* ============================================================
          PINNED 100VH SCENE
         ============================================================ */}

      <div
        className="
          sticky
          top-0
          h-screen
          w-full
          overflow-hidden
          bg-[#010213]
        "
      >
        {/* ==========================================================
            BACKGROUND
            HighlightTimelineBg remains completely untouched.
           ========================================================== */}

        <div
          className="
            pointer-events-none
            absolute
            inset-0
            z-0
          "
        >
          <div
            className="
              absolute
              inset-0
              flex
              items-center
              justify-center
            "
          >
            <div
              className="
                w-full
                [&>div]:w-full
                [&>div]:max-w-none
              "
            >
              <HighlightTimelineBg />
            </div>
          </div>
        </div>

        {/* ==========================================================
            BASE DARK CINEMATIC OVERLAY
           ========================================================== */}

        <motion.div
          style={{
            opacity: shouldReduceMotion ? 0.35 : darkOverlayOpacity,
          }}
          className="
            pointer-events-none
            absolute
            inset-0
            z-[5]
            bg-[#010213]
          "
        />

        {/* ==========================================================
            CENTER VIGNETTE
           ========================================================== */}

        {/* <div
          className="
            pointer-events-none
            absolute
            inset-0
            z-[6]
            bg-[radial-gradient(circle_at_50%_45%,rgba(1,2,19,0)_18%,rgba(1,2,19,0.08)_45%,rgba(1,2,19,0.45)_100%)]
          "
        /> */}

        {/* ==========================================================
            BOTTOM SHADOW
           ========================================================== */}

        <div
          className="
            pointer-events-none
            absolute
            inset-x-0
            bottom-0
            z-[7]
            h-[30%]
            bg-[linear-gradient(to_top,rgba(1,2,19,0.55),transparent)]
          "
        />

        {/* ==========================================================
            WASHED/LIFTED LAYER

            This gives the end of the sequence a little more air
            without ever becoming a white/light section.
           ========================================================== */}

        <motion.div
          style={{
            opacity: shouldReduceMotion ? 0 : washedOverlayOpacity,
          }}
          className="
            pointer-events-none
            absolute
            inset-0
            z-[8]
            bg-white
            mix-blend-soft-light
          "
        />

        {/* ==========================================================
            VERY SUBTLE FINAL GLOW
           ========================================================== */}

        <motion.div
          style={{
            opacity: shouldReduceMotion ? 0 : finalGlowOpacity,
          }}
          className="
            pointer-events-none
            absolute
            inset-0
            z-[9]
            bg-[radial-gradient(circle_at_50%_45%,rgba(255,255,255,0.16),transparent_58%)]
          "
        />

        {/* ==========================================================
            TEXT
           ========================================================== */}

        <div
          className="
            absolute
            inset-0
            z-[20]
            flex
            items-center
            justify-center
            px-5
            sm:px-8
          "
        >
          {/* ========================================================
              STATEMENT 1
             ======================================================== */}

          <motion.div
            style={{
              y: shouldReduceMotion ? 0 : statement1Y,
              opacity: shouldReduceMotion ? 1 : statement1Opacity,
              scale: shouldReduceMotion ? 1 : statement1Scale,
            }}
            className="
              absolute
              left-1/2
              top-1/2
              w-[min(1100px,calc(100%-40px))]
              -translate-x-1/2
              -translate-y-1/2
              text-center
              text-white
              will-change-transform
            "
          >
            <motion.div
              style={{
                opacity: shouldReduceMotion ? 1 : eyebrow1Opacity,
              }}
              className="
                mb-4
                text-[14px]
                font-semibold
                leading-none
                tracking-[-0.02em]
                sm:mb-5
                sm:text-[17px]
              "
            >
              One Workspace
            </motion.div>

            <h2
              className="
                text-[clamp(3rem,6.7vw,6.8rem)]
                font-semibold
                leading-[0.93]
                tracking-[-0.065em]
              "
            >
              Everything your team needs.
              <br />
              All in one flow.
            </h2>
          </motion.div>

          {/* ========================================================
              STATEMENT 2
             ======================================================== */}

          <motion.div
            style={{
              y: shouldReduceMotion ? 0 : statement2Y,
              opacity: shouldReduceMotion ? 1 : statement2Opacity,
              scale: shouldReduceMotion ? 1 : statement2Scale,
            }}
            className="
              absolute
              left-1/2
              top-1/2
              w-[min(1100px,calc(100%-40px))]
              -translate-x-1/2
              -translate-y-1/2
              text-center
              text-white
              will-change-transform
            "
          >
            <motion.div
              style={{
                opacity: shouldReduceMotion ? 1 : eyebrow2Opacity,
              }}
              className="
                mb-4
                text-[14px]
                font-semibold
                leading-none
                tracking-[-0.02em]
                sm:mb-5
                sm:text-[17px]
              "
            >
              People + AI
            </motion.div>

            <h2
              className="
                text-[clamp(3rem,6.7vw,6.8rem)]
                font-semibold
                leading-[0.93]
                tracking-[-0.065em]
              "
            >
              Humans and AI.
              <br />
              Working from the same plan.
            </h2>
          </motion.div>

          {/* ========================================================
              STATEMENT 3
             ======================================================== */}

          <motion.div
            style={{
              y: shouldReduceMotion ? 0 : statement3Y,
              opacity: shouldReduceMotion ? 1 : statement3Opacity,
              scale: shouldReduceMotion ? 1 : statement3Scale,
            }}
            className="
              absolute
              left-1/2
              top-1/2
              w-[min(1100px,calc(100%-40px))]
              -translate-x-1/2
              -translate-y-1/2
              text-center
              text-white
              will-change-transform
            "
          >
            <motion.div
              style={{
                opacity: shouldReduceMotion ? 1 : eyebrow3Opacity,
              }}
              className="
                mb-4
                text-[14px]
                font-semibold
                leading-none
                tracking-[-0.02em]
                sm:mb-5
                sm:text-[17px]
              "
            >
              From idea to done
            </motion.div>

            <h2
              className="
                text-[clamp(3rem,6.7vw,6.8rem)]
                font-semibold
                leading-[0.93]
                tracking-[-0.065em]
              "
            >
             Turn scattered work
              <br />
              into forward motion.
            </h2>
          </motion.div>
        </div>

        {/* ==========================================================
            SCROLL INDICATOR
           ========================================================== */}

        {!shouldReduceMotion && (
          <motion.div
            style={{
              opacity: useTransform(
                scrollYProgress,
                [0, 0.04, 0.12],
                [1, 1, 0]
              ),
            }}
            className="
              pointer-events-none
              absolute
              bottom-7
              left-1/2
              z-[30]
              hidden
              -translate-x-1/2
              flex-col
              items-center
              gap-3
              sm:flex
            "
          >
            <span
              className="
                text-[10px]
                font-medium
                uppercase
                tracking-[0.18em]
                text-white/65
              "
            >
              Scroll
            </span>

            <div
              className="
                h-9
                w-px
                bg-gradient-to-b
                from-white/65
                to-transparent
              "
            />
          </motion.div>
        )}
      </div>
    </section>
  );
}

export default HighlightTimeline;