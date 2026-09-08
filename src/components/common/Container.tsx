import { cn } from "@/lib/utils";
import type{ ReactNode } from "react";

export const Container = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => {
  return (
    <div className={cn("mx-auto max-w-[120rem] px-8", className)}>
      {children}
    </div>
  );
};