import { motion } from "framer-motion";

export function AutomationVisual() {
  const bars = [76, 124, 172, 220];

  return (
    <div className="relative h-full w-full">
      {/* Background glow */}

      <div
        className="
          absolute
          bottom-[-80px]
          right-[5%]
          h-[380px]
          w-[440px]
          rounded-full
          bg-[radial-gradient(
            circle,
            rgba(90,75,180,0.12),
            transparent_68%
          )]
          blur-2xl
        "
      />

      {/* Bars */}

      <div
        className="
          absolute
          bottom-0
          right-[6%]
          flex
          items-end
          gap-3
        "
      >
        {bars.map((barHeight, index) => (
          <motion.div
            key={barHeight}
            animate={{
              y: [
                0,
                index % 2 === 0 ? -4 : -7,
                0,
              ],
              opacity: [
                0.32 + index * 0.05,
                0.48 + index * 0.05,
                0.32 + index * 0.05,
              ],
            }}
            transition={{
              duration: 3.5 + index * 0.35,
              repeat: Infinity,
              ease: "easeInOut",
              delay: index * 0.12,
            }}
            style={{
              height: barHeight,
            }}
            className="
              w-[50px]
              rounded-t-[14px]
              border
              border-violet-400/15
              bg-gradient-to-t
              from-violet-500/[0.04]
              to-violet-400/[0.18]
            "
          />
        ))}
      </div>

      
      {/* Arrow */}

      <div
        className="
          absolute
          bottom-8
          right-0
          flex
          h-14
          w-14
          items-center
          justify-center
          rounded-full
          border
          border-white/[0.08]
          bg-white/[0.035]
        "
      >
        <span className="translate-x-[1px] text-xl text-white/55">
          →
        </span>
      </div>
    </div>
  );
}