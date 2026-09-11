import { motion } from "framer-motion";

export function AIVisual() {
  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* ===================================================== */}
      {/* Outer glow                                              */}
      {/* ===================================================== */}

      <div
        className="
          absolute
          bottom-[-155px]
          right-[-45px]
          h-[520px]
          w-[520px]
          rounded-full
          bg-[radial-gradient(
            circle,
            rgba(112,91,225,0.20)_0%,
            rgba(70,56,155,0.07)_38%,
            transparent_70%
          )]
        "
      />

      {/* ===================================================== */}
      {/* Outer ring                                              */}
      {/* ===================================================== */}

      <div
        className="
          absolute
          bottom-[-120px]
          right-[-30px]
          h-[480px]
          w-[480px]
          rounded-full
          border
          border-white/[0.045]
        "
      />

      {/* ===================================================== */}
      {/* Middle ring                                             */}
      {/* ===================================================== */}

      <div
        className="
          absolute
          bottom-[-55px]
          right-[35px]
          h-[350px]
          w-[350px]
          rounded-full
          border
          border-white/[0.06]
        "
      />

      {/* ===================================================== */}
      {/* Inner ring                                              */}
      {/* ===================================================== */}

      <div
        className="
          absolute
          bottom-[8px]
          right-[105px]
          h-[235px]
          w-[235px]
          rounded-full
          border
          border-white/[0.07]
          bg-violet-500/[0.025]
        "
      />

      {/* ===================================================== */}
      {/* Core                                                    */}
      {/* ===================================================== */}

      <div
        className="
          absolute
          bottom-[46px]
          right-[145px]
          h-[155px]
          w-[155px]
          rounded-full
          border
          border-violet-300/[0.10]
          bg-violet-400/[0.045]
          shadow-[0_0_90px_rgba(113,88,240,0.16)]
        "
      />

      {/* ===================================================== */}
      {/* AI symbol                                               */}
      {/* ===================================================== */}

      <motion.div
        animate={{
          scale: [1, 1.07, 1],
          rotate: [0, 8, 0],
          opacity: [0.75, 1, 0.75],
        }}
        transition={{
          duration: 4.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="
          absolute
          bottom-[93px]
          right-[195px]
          text-[52px]
          leading-none
          text-violet-300/85
          drop-shadow-[0_0_28px_rgba(133,109,255,0.8)]
        "
      >
        ✦
      </motion.div>
    </div>
  );
}