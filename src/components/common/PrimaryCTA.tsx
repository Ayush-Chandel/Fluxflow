import { ArrowRight } from "lucide-react";
import { Link, type LinkProps } from "react-router-dom";
import { cn } from "@/lib/utils";

type PrimaryCTAProps = LinkProps & {
  children: React.ReactNode;
};

/*
  The landing page's solid CTA: a violet button carrying a pale-violet chip at
  its right edge. On hover the chip grows left across the whole button, so the
  accent the eye already landed on becomes the button.

  Pure CSS rather than motion state: the only moving parts are the chip's four
  insets and two colours, all of which a transition on the group handles — no
  re-render per pointer event, and it keeps working while JS hydrates.
*/
export default function PrimaryCTA({
  children,
  className,
  ...props
}: PrimaryCTAProps) {
  return (
    <Link
      {...props}
      data-cursor="cta"
      className={cn(
        // inline-flex (not the <a> default of `inline`) so the h-12 is real and
        // the chip has a box to be positioned against.
        "group relative inline-flex h-12 w-fit shrink-0 items-center overflow-hidden",
        "rounded-xl bg-[#402e8e] align-middle inset-ring-1 inset-ring-white/15",
        "pl-6 pr-1 focus-visible:outline-none",
        className
      )}
    >
      {/* =====================================================
          THE FILL

          At rest it is the 40px chip inset 4px from the right
          edge; on hover it takes the button's own box and radius
          (inset-0, rounded-xl), which reads as the accent
          flooding leftwards.

          `inset-0` under group-hover is two classes, so it
          outranks the resting `left-[...]` whatever the order
          Tailwind emits them in.
      ===================================================== */}
      <span
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          bottom-1
          right-1
          top-1
          left-[calc(100%_-_2.75rem)]
          rounded-lg
          bg-[#c4b5fd]
          transition-[top,right,bottom,left,border-radius]
          duration-[450ms]
          ease-[cubic-bezier(0.76,0,0.24,1)]
          group-hover:inset-0
          group-hover:rounded-xl
          group-focus-visible:inset-0
          group-focus-visible:rounded-xl
          motion-reduce:transition-none
        "
      />

      {/* =====================================================
          LABEL

          Flips to the page's near-black once the fill has
          travelled far enough to sit under it. The delay lives
          on the hover rule only, so leaving snaps the label
          back white as the fill retreats instead of trailing
          it.
      ===================================================== */}
      <span
        className="
          relative
          z-10
          whitespace-nowrap
          text-[15px]
          
          text-white
          transition-colors
          duration-200
          group-hover:text-[#010213]
          group-hover:delay-[220ms]
          group-focus-visible:text-[#010213]
          group-focus-visible:delay-[220ms]
          motion-reduce:transition-none
          motion-reduce:delay-0
        "
      >
        {children}
      </span>

      {/* =====================================================
          ARROW

          Centred in the resting chip (4px gutter + half of the
          40px chip), and dark in both states because it always
          sits on the accent.
      ===================================================== */}
      <span className="relative z-10 ml-3 flex h-10 w-10 items-center justify-center text-[#010213]">
        <ArrowRight
          size={17}
          strokeWidth={2}
          className="transition-transform duration-[450ms] ease-[cubic-bezier(0.76,0,0.24,1)] group-hover:translate-x-0.5 motion-reduce:transition-none"
        />
      </span>
    </Link>
  );
}
