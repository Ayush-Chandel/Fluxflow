import { motion } from "framer-motion";

export function PlanningVisual() {
  return (
    <div className="relative h-full w-full">
      {/* ===================================================== */}
      {/* Glow                                                    */}
      {/* ===================================================== */}

      <div
        className="
          absolute
          right-[8%]
          top-[8%]
          h-[320px]
          w-[320px]
          rounded-full
          bg-violet-500/[0.07]
          blur-[100px]
        "
      />

      {/* ===================================================== */}
      {/* Outer product silhouette                               */}
      {/* ===================================================== */}

      <div
        className="
          absolute
          right-[2%]
          top-[6%]
          h-[330px]
          w-[520px]
          rounded-[24px]
          border
          border-violet-300/[0.06]
          bg-violet-500/[0.012]
        "
      />

      {/* ===================================================== */}
      {/* Product window                                          */}
      {/* ===================================================== */}

      <motion.div
        animate={{
          rotate: [-2.5, -1, -2.5],
          y: [10, 0, 10],
        }}
        transition={{
          duration: 7,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="
          absolute
          right-[-2%]
          top-[10%]
          h-[310px]
          w-[510px]
          overflow-hidden
          rounded-[20px]
          border
          border-white/[0.08]
          bg-[#0a0a18]/90
          shadow-[0_0_80px_rgba(70,55,180,0.10)]
          backdrop-blur-xl
        "
      >
        {/* Header */}

        <div
          className="
            flex
            items-center
            justify-between
            border-b
            border-white/[0.07]
            px-5
            py-4
          "
        >
          <span
            className="
              text-[14px]
              font-medium
              text-white/75
            "
          >
            Product Launch
          </span>

          <div className="flex -space-x-2">
            {[1, 2, 3].map((person) => (
              <div
                key={person}
                className="
                  h-7
                  w-7
                  rounded-full
                  border-2
                  border-[#0a0a18]
                  bg-white/10
                "
              />
            ))}
          </div>
        </div>

        {/* Body */}

        <div
          className="
            grid
            grid-cols-[1fr_145px]
            gap-5
            p-5
          "
        >
          <div className="space-y-4">
            <PlanningRow
              label="Define goals"
              completed
            />

            <PlanningRow label="Create roadmap" />

            <PlanningRow label="Assign owners" />

            <PlanningRow label="Track progress" />
          </div>

          {/* Chart */}

          <div
            className="
              relative
              overflow-hidden
              rounded-xl
              border
              border-white/[0.05]
              bg-white/[0.015]
              p-4
            "
          >
            <div
              className="
                absolute
                left-7
                top-7
                h-3
                w-3
                rotate-45
                bg-violet-400/80
                shadow-[0_0_18px_rgba(130,105,255,0.6)]
              "
            />

            <div
              className="
                ml-1
                mt-10
                h-2
                w-14
                rounded-full
                bg-violet-400/70
              "
            />

            <div
              className="
                ml-5
                mt-7
                h-2
                w-20
                rounded-full
                bg-violet-400/35
              "
            />

            <div
              className="
                ml-9
                mt-7
                h-2
                w-24
                rounded-full
                bg-violet-400/20
              "
            />

            <div
              className="
                ml-14
                mt-7
                h-2
                w-16
                rounded-full
                bg-violet-400/10
              "
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function PlanningRow({
  label,
  completed = false,
}: {
  label: string;
  completed?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={[
          "flex h-5 w-5 items-center justify-center rounded-full border",
          completed
            ? "border-violet-400/70 bg-violet-500"
            : "border-white/15",
        ].join(" ")}
      >
        {completed && (
          <span className="text-[9px] font-bold text-white">
            ✓
          </span>
        )}
      </div>

      <span className="text-sm text-white/40">
        {label}
      </span>
    </div>
  );
}