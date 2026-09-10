
import timelineimg from "@/assets/timeline.webp";

type Props = {}

function HighlightTimelineBg({}: Props) {
  return (
     <div
        className="
          relative
          mx-auto
          w-full
          max-w-full
          overflow-hidden
          rounded-[14px]
        "
        style={{
          background: `
            linear-gradient(
              to bottom,
              rgba(255, 255, 255, 0.26) 0%,
              rgba(255, 255, 255, 0.24) 25%,
              rgba(255, 255, 255, 0.20) 50%,
              rgba(255, 255, 255, 0.14) 75%,
              rgba(255, 255, 255, 0.10) 100%
            )
          `,
        }}
      >
        {/* Timeline artwork */}
        <img
          src={timelineimg}
          alt=""
          className="
            relative
            z-[1]
            block
            h-auto
            w-full
          "
        />

        {/* Bottom fade into the page */}
        <div
          className="
            pointer-events-none
            absolute
            inset-x-0
            bottom-0
            z-[10]
            h-[45%]
          "
          style={{
            background: `
              linear-gradient(
                to bottom,
                rgba(1, 2, 19, 0) 0%,
                rgba(1, 2, 19, 0.08) 20%,
                rgba(1, 2, 19, 0.35) 50%,
                rgba(1, 2, 19, 0.75) 75%,
                rgba(1, 2, 19, 0.98) 100%
              )
            `,
          }}
        />

        {/* Subtle glass highlight + border */}
        <div
          className="
            pointer-events-none
            absolute
            inset-0
            z-[20]
            rounded-[14px]
          "
          style={{
            background: `
              linear-gradient(
                to bottom,
                rgba(255, 255, 255, 0.08) 0%,
                rgba(255, 255, 255, 0.02) 35%,
                rgba(255, 255, 255, 0.01) 65%
              )
            `,
            border: "1px solid rgba(255, 255, 255, 0.18)",
          }}
        />
      </div>
  )
}

export default HighlightTimelineBg