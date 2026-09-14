import type { CursorState, CursorType } from "@/types/landing";
import {
  motion,
  useMotionValue,
  useSpring,
} from "framer-motion";
import { useEffect, useState } from "react";

const CURSOR_SIZES: Record<CursorType, number> = {
  default: 7,
  link: 24,
  cta: 52,
  description: 68,
  heading: 84,
};

const DEFAULT_LABELS: Record<
  Exclude<CursorType, "default">,
  string
> = {
  link: "OPEN",
  cta: "OPEN",
  description: "READ",
  heading: "EXPLORE",
};

function getCursorState(
  target: EventTarget | null
): CursorState {
  if (!(target instanceof Element)) {
    return {
      type: "default",
      label: "",
    };
  }

  const element = target.closest("[data-cursor]");

  if (!element) {
    return {
      type: "default",
      label: "",
    };
  }

  const rawType = element.getAttribute("data-cursor");

  const type: CursorType =
    rawType === "link" ||
    rawType === "cta" ||
    rawType === "description" ||
    rawType === "heading"
      ? rawType
      : "link";

  const customLabel =
    element.getAttribute("data-cursor-label");

  return {
    type,
    label:
      customLabel ||
      DEFAULT_LABELS[type],
  };
}

export default function GlobalCursor() {
  const [enabled, setEnabled] = useState(false);
  const [cursorState, setCursorState] =
    useState<CursorState>({
      type: "default",
      label: "",
    });

  const [visible, setVisible] = useState(false);

  /*
   * Raw pointer position
   */
  const pointerX = useMotionValue(-100);
  const pointerY = useMotionValue(-100);

  /*
   * Spring-following position.
   *
   * Higher stiffness = follows pointer more tightly
   * Higher damping = less overshoot
   */
  const x = useSpring(pointerX, {
    stiffness: 500,
    damping: 40,
    mass: 0.45,
  });

  const y = useSpring(pointerY, {
    stiffness: 500,
    damping: 40,
    mass: 0.45,
  });

  /*
   * Cursor size is also spring animated.
   */
  const targetSize = useMotionValue(
    CURSOR_SIZES.default
  );

  const size = useSpring(targetSize, {
  stiffness: 380,
  damping: 28,
  mass: 0.45,
});

  /*
   * Only enable the cursor when the device
   * has a fine pointer (mouse/trackpad).
   */
  useEffect(() => {
    const mediaQuery = window.matchMedia(
      "(pointer: fine)"
    );

    const updatePointerType = () => {
      setEnabled(mediaQuery.matches);

      if (!mediaQuery.matches) {
        setVisible(false);
      }
    };

    updatePointerType();

    mediaQuery.addEventListener(
      "change",
      updatePointerType
    );

    return () => {
      mediaQuery.removeEventListener(
        "change",
        updatePointerType
      );
    };
  }, []);

  /*
   * Animate size whenever the cursor state changes.
   */
  useEffect(() => {
    console.log(cursorState.type);
    
    targetSize.set(
      CURSOR_SIZES[cursorState.type]
    );
  }, [cursorState.type, targetSize]);

  /*
   * Global pointer listeners.
   */
  useEffect(() => {
    if (!enabled) return;

    const handlePointerMove = (
      event: PointerEvent
    ) => {
      pointerX.set(event.clientX);
      pointerY.set(event.clientY);

      setVisible(true);
    };

    const handlePointerOver = (
      event: PointerEvent
    ) => {
      setCursorState(
        getCursorState(event.target)
      );
    };

    const handlePointerOut = (
      event: PointerEvent
    ) => {
      const relatedTarget =
        event.relatedTarget;

      /*
       * Don't reset the cursor when moving
       * between children inside the same target.
       */
      if (
        relatedTarget instanceof Element &&
        relatedTarget.closest("[data-cursor]")
      ) {
        return;
      }

      setCursorState({
        type: "default",
        label: "",
      });
    };

    const handlePointerLeave = () => {
      setVisible(false);

      setCursorState({
        type: "default",
        label: "",
      });
    };

    window.addEventListener(
      "pointermove",
      handlePointerMove,
      { passive: true }
    );

    document.addEventListener(
      "pointerover",
      handlePointerOver
    );

    document.addEventListener(
      "pointerout",
      handlePointerOut
    );

    document.addEventListener(
      "pointerleave",
      handlePointerLeave
    );

    return () => {
      window.removeEventListener(
        "pointermove",
        handlePointerMove
      );

      document.removeEventListener(
        "pointerover",
        handlePointerOver
      );

      document.removeEventListener(
        "pointerout",
        handlePointerOut
      );

      document.removeEventListener(
        "pointerleave",
        handlePointerLeave
      );
    };
  }, [
    enabled,
    pointerX,
    pointerY,
  ]);

  if (!enabled) {
    return null;
  }

  const isDefault =
    cursorState.type === "default";

  return (
    <motion.div
      aria-hidden="true"
      className="
        pointer-events-none
        fixed
        left-0
        top-0
        z-[9999]
        flex
        items-center
        justify-center
        rounded-full
        bg-white
        shadow-[0_0_20px_rgba(255,255,255,0.08)]
      "
      style={{
        x,
        y,
        width: size,
        height: size,
        translateX: "-50%",
        translateY: "-50%",
        mixBlendMode: "difference",
      }}
      animate={{
        opacity: visible ? 1 : 0,
      }}
      transition={{
        opacity: {
          duration: 0.2,
          ease: "easeOut",
        },
      }}
    >
      {/* <motion.span
        className="
          select-none
          whitespace-nowrap
          text-[9px]
          font-medium
          uppercase
          tracking-[0.08em]
          text-black
        "
        animate={{
          opacity: isDefault ? 0 : 1,
          scale: isDefault ? 0.7 : 1,
        }}
        transition={{
          duration: 0.18,
          ease: [0.22, 1, 0.36, 1],
        }}
      >
        {cursorState.label}
      </motion.span> */}
    </motion.div>
  );
}