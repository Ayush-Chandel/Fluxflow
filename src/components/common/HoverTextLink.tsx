import { useState } from "react";
import { Link, type LinkProps } from "react-router-dom";
import { cn } from "@/lib/utils";
import HoverTextSwap from "./HoverTextSwap";
import type { CursorType } from "@/types/landing";

type HoverTextLinkProps = Omit<LinkProps, "children"> & {
  text: string;
  hoverText?: string;
  className?: string;
  dataCursor?:CursorType
};

export default function HoverTextLink({
  text,
  hoverText,
  className,
  onPointerEnter,
  onPointerLeave,
  onFocus,
  onBlur,
  dataCursor,
  ...props
}: HoverTextLinkProps) {
  const [active, setActive] = useState(false);

  return (
    <Link
      {...props}
      data-cursor={dataCursor}
      className={cn(
        "inline-flex items-center",
        "focus-visible:outline-none",
        className
      )}
      onPointerEnter={(event) => {
        setActive(true);
        onPointerEnter?.(event);
      }}
      onPointerLeave={(event) => {
        setActive(false);
        onPointerLeave?.(event);
      }}
      onFocus={(event) => {
        setActive(true);
        onFocus?.(event);
      }}
      onBlur={(event) => {
        setActive(false);
        onBlur?.(event);
      }}
    >
      <HoverTextSwap
        text={text}
        hoverText={hoverText}
        active={active}
      />
    </Link>
  );
}