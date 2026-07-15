import * as React from "react";
import { cn } from "@/lib/utils";

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      "flex h-11 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-950 outline-none transition focus:border-brand-orange focus:ring-2 focus:ring-orange-100 disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-500",
      className
    )}
    {...props}
  />
));
Select.displayName = "Select";
