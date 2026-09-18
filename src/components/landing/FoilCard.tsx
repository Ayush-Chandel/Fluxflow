
import * as React from "react";
import {
  motion,
  useMotionValue,
  useSpring,
} from "framer-motion";

export default function FoilCard() {
  const cardRef = React.useRef<HTMLDivElement>(null);

  // ============================================================
  // 3D TILT
  // ============================================================

  const rotateXRaw = useMotionValue(0);
  const rotateYRaw = useMotionValue(0);

  const rotateX = useSpring(rotateXRaw, {
    stiffness: 170,
    damping: 24,
    mass: 0.7,
  });

  const rotateY = useSpring(rotateYRaw, {
    stiffness: 170,
    damping: 24,
    mass: 0.7,
  });

  // ============================================================
  // CONTENT PARALLAX
  // ============================================================

  const contentXRaw = useMotionValue(0);
  const contentYRaw = useMotionValue(0);

  const contentX = useSpring(contentXRaw, {
    stiffness: 150,
    damping: 22,
  });

  const contentY = useSpring(contentYRaw, {
    stiffness: 150,
    damping: 22,
  });

  // ============================================================
  // RESET
  // ============================================================

  const reset = React.useCallback(() => {
    rotateXRaw.set(0);
    rotateYRaw.set(0);
    contentXRaw.set(0);
    contentYRaw.set(0);

    const card = cardRef.current;
    if (!card) return;

    card.style.setProperty("--m-x", "50%");
    card.style.setProperty("--m-y", "50%");
    card.style.setProperty("--bg-x", "50%");
    card.style.setProperty("--bg-y", "50%");
    card.style.setProperty("--foil-x", "50%");
    card.style.setProperty("--foil-y", "50%");
    card.style.setProperty("--opacity", "0");
    card.style.setProperty("--foil-angle", "118deg");
  }, [
    contentXRaw,
    contentYRaw,
    rotateXRaw,
    rotateYRaw,
  ]);

  // ============================================================
  // POINTER MOVE
  // ============================================================

  function handlePointerMove(
    e: React.PointerEvent<HTMLDivElement>
  ) {
    const card = cardRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();

    const px = Math.min(
      1,
      Math.max(
        0,
        (e.clientX - rect.left) / rect.width
      )
    );

    const py = Math.min(
      1,
      Math.max(
        0,
        (e.clientY - rect.top) / rect.height
      )
    );

    // -1 → +1
    const nx = px * 2 - 1;
    const ny = py * 2 - 1;

    // ==========================================================
    // TILT
    // Keep the same restrained tilt.
    // ==========================================================

    rotateYRaw.set(nx * 7);
    rotateXRaw.set(ny * -7);

    // ==========================================================
    // CONTENT PARALLAX
    // ==========================================================

    contentXRaw.set(nx * 5);
    contentYRaw.set(ny * 4);

    // ==========================================================
    // MOUSE POSITION
    // ==========================================================

    card.style.setProperty(
      "--m-x",
      `${px * 100}%`
    );

    card.style.setProperty(
      "--m-y",
      `${py * 100}%`
    );

    // ==========================================================
    // GRADIENT TRAVEL
    // ==========================================================

    card.style.setProperty(
      "--bg-x",
      `${50 + nx * 45}%`
    );

    card.style.setProperty(
      "--bg-y",
      `${50 + ny * 45}%`
    );

    // Foil pattern moves slightly less.
    card.style.setProperty(
      "--foil-x",
      `${50 + nx * 12}%`
    );

    card.style.setProperty(
      "--foil-y",
      `${50 + ny * 12}%`
    );

    // ==========================================================
    // METALLIC ANGLE
    // ==========================================================

    const angle =
      118 +
      nx * 38 +
      ny * 16;

    card.style.setProperty(
      "--foil-angle",
      `${angle}deg`
    );

    // ==========================================================
    // SHINE
    // ==========================================================

    const distance = Math.min(
      1,
      Math.sqrt(
        nx * nx +
        ny * ny
      )
    );

    card.style.setProperty(
      "--opacity",
      `${0.7 + distance * 0.3}`
    );
  }

  return (
    <main className="min-h-screen bg-[#01030b] p-8 sm:p-12">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-center justify-center">

        {/* ========================================================
            3D SCENE
        ======================================================== */}

        <motion.div
          ref={cardRef}
          onPointerMove={handlePointerMove}
          onPointerLeave={reset}
          onPointerCancel={reset}
          style={{
            rotateX,
            rotateY,
            transformPerspective: 1200,
          }}
          className="
            relative
            w-full
            max-w-[900px]
          "
        >
          {/* ======================================================
              OUTER REACTIVE EDGE
          ====================================================== */}

          <div
            className="
              pointer-events-none
              absolute
              -inset-px
              rounded-[24px]
            "
            style={{
              background: `
                radial-gradient(
                  220px circle
                  at var(--m-x) var(--m-y),

                  rgba(180,185,200,.44),

                  rgba(120,130,160,.10) 45%,

                  transparent 75%
                )
              `,
              opacity:
                "calc(.25 + var(--opacity) * .75)",
            }}
          />

          {/* ======================================================
              CARD
          ====================================================== */}

          <div
            className="
              relative
              min-h-[360px]
              overflow-hidden
              rounded-[24px]
              border
              border-white/[0.07]
              bg-[#000212]
            "
            style={{
              isolation: "isolate",

              boxShadow: `
                0 28px 80px rgba(0,0,0,.62),
                inset 0 1px 0 rgba(255,255,255,.05),
                inset 0 -1px 0 rgba(0,0,0,.75)
              `,
            }}
          >

            {/* ====================================================
                BASE
            ==================================================== */}

            <div className="absolute inset-0 bg-[#000212]" />

            {/* ====================================================
                DARK BLUE ENVIRONMENT
            ==================================================== */}

            <div
              className="
                pointer-events-none
                absolute
                inset-0
              "
              style={{
                background: `
                  radial-gradient(
                    520px circle
                    at 9% 52%,
                    rgba(24,57,255,.23),
                    transparent 52%
                  ),

                  radial-gradient(
                    420px circle
                    at 89% 14%,
                    rgba(70,80,255,.075),
                    transparent 50%
                  ),

                  linear-gradient(
                    108deg,
                    rgba(3,8,26,.94),
                    rgba(1,3,12,.98) 55%,
                    rgba(0,2,10,.99)
                  )
                `,
              }}
            />

            {/* ====================================================
                MONOCHROME FOIL SYSTEM

                Based on the Linear-style CSS supplied:
                - pattern
                - spectrum
                - diagonal metal
                - radial mouse light
                - color-dodge

                Rainbow has been replaced with black/white/gray.
            ==================================================== */}

            <div
              className="
                pointer-events-none
                absolute
                inset-0
                z-[2]
              "
              style={
                {
                  "--m-x": "50%",
                  "--m-y": "50%",
                  "--bg-x": "50%",
                  "--bg-y": "50%",
                  "--foil-x": "50%",
                  "--foil-y": "50%",
                  "--foil-angle": "118deg",
                  "--opacity": "0",

                  background: `
                    /*
                     * Monochrome spectrum
                     */
                    repeating-linear-gradient(
                      0deg,

                      #05070b 0%,
                      #15181e 9%,

                      #f5f6f7 17%,

                      #70747a 23%,

                      #080a0e 31%,

                      #ffffff 39%,

                      #30343a 47%,

                      #07090d 58%,

                      #d9dadd 68%,

                      #0a0c11 79%,

                      #ffffff 88%,

                      #05070b 100%
                    )
                    var(--bg-x)
                    var(--bg-y)
                    / 220%
                    720%
                    no-repeat,

                    /*
                     * Directional metallic bands
                     */
                    repeating-linear-gradient(
                      var(--foil-angle),

                      #03050a 0%,

                      #11141a 3.5%,

                      #8d9299 4%,

                      #ffffff 4.45%,

                      #8b9097 4.9%,

                      #11141a 5.5%,

                      #03050a 10%,

                      #03050a 12%
                    )
                    var(--bg-x)
                    var(--bg-y)
                    / 300%
                    no-repeat,

                    /*
                     * Cursor-driven shade
                     */
                    radial-gradient(
                      farthest-corner
                      circle
                      at var(--m-x)
                      var(--m-y),

                      rgba(255,255,255,.08) 12%,

                      rgba(255,255,255,.16) 22%,

                      rgba(255,255,255,.30) 48%,

                      rgba(0,0,0,.44) 100%
                    )
                    var(--bg-x)
                    var(--bg-y)
                    / 300%
                    no-repeat
                  `,

                  backgroundBlendMode:
                    "normal, overlay, overlay",

                  mixBlendMode:
                    "color-dodge",

                  opacity:
                    "var(--opacity)",

                  willChange:
                    "background, opacity",

                  transition:
                    "opacity 180ms ease-out",

                  filter:
                    "saturate(0) contrast(1.15)",
                } as React.CSSProperties
              }
            />

            {/* ====================================================
                BLUE COLOR INTEGRATION
            ==================================================== */}

            <div
              className="
                pointer-events-none
                absolute
                inset-0
                z-[3]
              "
              style={{
                background: `
                  radial-gradient(
                    520px circle
                    at 10% 52%,
                    rgba(33,63,255,.27),
                    transparent 56%
                  ),

                  linear-gradient(
                    110deg,
                    rgba(2,7,22,.34),
                    rgba(0,2,12,.60)
                  )
                `,

                mixBlendMode: "multiply",
              }}
            />

            {/* ====================================================
                CURSOR HOTSPOT

                No centered/fixed beam.
                This exists only around the cursor.
            ==================================================== */}

            <div
              className="
                pointer-events-none
                absolute
                inset-0
                z-[4]
              "
              style={{
                background: `
                  radial-gradient(
                    190px circle
                    at var(--m-x) var(--m-y),

                    rgba(255,255,255,.18),

                    rgba(205,210,220,.11) 20%,

                    rgba(130,145,180,.045) 40%,

                    transparent 72%
                  )
                `,

                mixBlendMode:
                  "screen",

                opacity:
                  "calc(.35 + var(--opacity) * .65)",
              }}
            />

            {/* ====================================================
                SOFT REFLECTIVE RIM
            ==================================================== */}

            <div
              className="
                pointer-events-none
                absolute
                inset-0
                z-[5]
                rounded-[24px]
              "
              style={{
                background: `
                  radial-gradient(
                    260px circle
                    at var(--m-x) var(--m-y),

                    rgba(190,200,230,.38),

                    transparent 70%
                  )
                `,

                maskImage:
                  "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",

                maskComposite:
                  "exclude",

                WebkitMaskImage:
                  "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",

                WebkitMaskComposite:
                  "xor",

                padding: "1px",

                opacity:
                  "calc(.20 + var(--opacity) * .80)",
              }}
            />

            {/* ====================================================
                DECORATIVE CURVES
            ==================================================== */}

            <div
              className="
                pointer-events-none
                absolute
                -left-[165px]
                -top-[145px]
                z-[6]
                h-[520px]
                w-[520px]
                rounded-full
                border
                border-blue-500/20
              "
              style={{
                transform:
                  "rotate(-30deg)",
              }}
            />

            <div
              className="
                pointer-events-none
                absolute
                -left-[105px]
                -top-[100px]
                z-[6]
                h-[430px]
                w-[430px]
                rounded-full
                border
                border-blue-400/10
              "
              style={{
                transform:
                  "rotate(-30deg)",
              }}
            />

            {/* ====================================================
                CONTENT
            ==================================================== */}

            <div
              className="
                relative
                z-[10]
                grid
                min-h-[360px]
                grid-cols-[290px_1fr]
              "
            >

              {/* LEFT */}

              <motion.div
                style={{
                  x: contentX,
                  y: contentY,
                }}
                className="
                  flex
                  items-center
                  justify-center
                "
              >
                <div
                  className="
                    flex
                    items-center
                    text-[30px]
                    font-semibold
                    tracking-[-0.055em]
                    text-white
                  "
                >
                  <span>
                    ramp
                  </span>

                  <span
                    className="
                      ml-2
                      inline-block
                      text-[22px]
                      text-white/80
                      [transform:rotate(-34deg)]
                    "
                  >
                    ◢
                  </span>
                </div>
              </motion.div>

              {/* RIGHT */}

              <motion.div
                style={{
                  x: contentX,
                  y: contentY,
                }}
                className="
                  flex
                  flex-col
                  justify-center
                  px-12
                  py-14
                "
              >
                <p
                  className="
                    max-w-[540px]
                    text-[22px]
                    font-semibold
                    leading-[1.35]
                    tracking-[-0.025em]
                    text-white/90
                  "
                >
                  “When an issue is added
                  to Linear, it moves from
                  the space of ideas to being
                  actionable. That is aligned
                  with engineering culture
                  at Ramp.”
                </p>

                <div
                  className="
                    mt-6
                    text-[18px]
                    font-medium
                    text-indigo-300
                  "
                >
                  Read Story ↗
                </div>
              </motion.div>

            </div>

            {/* ====================================================
                FINAL CARD EDGE
            ==================================================== */}

            <div
              className="
                pointer-events-none
                absolute
                inset-0
                z-[20]
                rounded-[24px]
              "
              style={{
                border:
                  "1px solid rgba(255,255,255,.08)",

                boxShadow:
                  "inset 0 1px 0 rgba(255,255,255,.055)",
              }}
            />
          </div>
        </motion.div>
      </div>
    </main>
  );
}