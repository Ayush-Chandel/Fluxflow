import { Link } from "react-router-dom";
import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import type{ AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type ButtonBaseProps = VariantProps<typeof buttonClasses> & {
  children: ReactNode;
};

interface ButtonAsAnchorProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
}

interface ButtonAsButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  href?: never;
}

type ButtonProps = ButtonBaseProps &
  (ButtonAsAnchorProps | ButtonAsButtonProps);

const buttonClasses = cva("relative rounded-full inline-flex items-center", {
  variants: {
    variant: {
      primary: [
        "bg-primary-gradient hover:text-shadow hover:shadow-primary transition-[shadow,text-shadow]",
        "[&_.highlight]:ml-2",
      ],
      secondary: [
        "text-off-white bg-white bg-opacity-10 border border-transparent-white backdrop-filter-[12px] hover:bg-opacity-20 transition-colors ease-in",
        "[&_.highlight]:bg-transparent-white [&_.highlight]:rounded-full [&_.highlight]:px-2 [&_.highlight:last-child]:ml-2 [&_.highlight:last-child]:-mr-2 [&_.highlight:first-child]:-ml-2 [&_.highlight:first-child]:mr-2",
      ],
    },
    size: {
      small: "text-xs px-3 h-7",
      medium: "text-sm px-4 h-8",
      large: "text-md px-6 h-12",
    },
  },
  defaultVariants: {
    variant: "primary",
    size: "medium",
  },
});

export const Highlight = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => <span className={cn("highlight", className)}>{children}</span>;

export const Button = ({ children, variant, size, ...props }: ButtonProps) => {
  const classes = cn(buttonClasses({ variant, size }), props.className);

  if ("href" in props && props.href !== undefined) {
    return (
      <Link to={props.href} {...(props as ButtonAsAnchorProps)} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button {...(props as ButtonAsButtonProps)} className={classes}>
      {children}
    </button>
  );
};