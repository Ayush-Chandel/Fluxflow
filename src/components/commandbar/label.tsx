import { cn } from "@/lib/utils";

type LabelType = "bug" | "feature" | "improvement";

const typeClasses = {
  bug: "bg-[#eb5757]",
  feature: "bg-[#bb87fc]",
  improvement: "bg-[#4da7fc]",
};

export const LabelIcon = ({ type }: { type: LabelType }) => (
  <div
    className={cn(
      "flex h-[9px] w-[9px] items-center justify-center rounded-full",
      typeClasses[type]
    )}
  />
);
