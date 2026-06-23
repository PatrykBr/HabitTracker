import * as React from "react";
import { type VariantProps, cva } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-full text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-ink text-paper shadow-[0_12px_30px_rgba(25,31,45,0.22)] hover:bg-ink/90 focus-visible:outline-ink",
        ember: "bg-ember text-white shadow-[0_12px_28px_rgba(184,75,59,0.28)] hover:bg-ember/90 focus-visible:outline-ember",
        quiet: "bg-paper text-ink ring-1 ring-ink/10 hover:bg-white focus-visible:outline-ink",
        ghost: "text-ink/70 hover:bg-ink/5 hover:text-ink focus-visible:outline-ink",
      },
      size: {
        sm: "h-9 px-4",
        md: "h-11 px-5",
        lg: "h-14 px-7 text-base",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>;

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return <button className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}

export function buttonClassName(options?: VariantProps<typeof buttonVariants> & { className?: string }) {
  return cn(buttonVariants({ variant: options?.variant, size: options?.size }), options?.className);
}
