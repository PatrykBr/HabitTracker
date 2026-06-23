import * as React from "react";

import { cn } from "@/lib/utils";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <section
      className={cn("rounded-[2rem] border border-ink/10 bg-white/75 p-5 shadow-[0_20px_70px_rgba(25,31,45,0.08)] backdrop-blur", className)}
      {...props}
    />
  );
}

export function Field({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-12 w-full rounded-2xl border border-ink/10 bg-paper px-4 text-sm text-ink outline-none transition placeholder:text-ink/35 focus:border-ink/30 focus:bg-white focus:ring-4 focus:ring-mint/30",
        className,
      )}
      {...props}
    />
  );
}

export function TextArea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-h-24 w-full resize-none rounded-2xl border border-ink/10 bg-paper px-4 py-3 text-sm text-ink outline-none transition placeholder:text-ink/35 focus:border-ink/30 focus:bg-white focus:ring-4 focus:ring-mint/30",
        className,
      )}
      {...props}
    />
  );
}

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("text-sm font-semibold text-ink", className)} {...props} />;
}
