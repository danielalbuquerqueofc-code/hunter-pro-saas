import { cn } from "@/lib/utils";

const variants = {
  success: "bg-emerald-100 text-emerald-700",
  warning: "bg-amber-100 text-amber-700",
  danger: "bg-red-100 text-red-700",
  neutral: "bg-zinc-100 text-zinc-700"
};

export function StatusBadge({
  children,
  variant = "neutral"
}: {
  children: React.ReactNode;
  variant?: keyof typeof variants;
}) {
  return (
    <span className={cn("rounded-full px-3 py-1 text-xs font-black", variants[variant])}>
      {children}
    </span>
  );
}
