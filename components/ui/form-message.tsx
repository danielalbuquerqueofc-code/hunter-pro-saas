import { cn } from "@/lib/utils";

type FormMessageProps = {
  type?: "error" | "success";
  children?: string | null;
};

export function FormMessage({ type = "error", children }: FormMessageProps) {
  if (!children) {
    return null;
  }

  return (
    <p
      className={cn(
        "rounded-lg border px-3 py-2 text-sm font-semibold",
        type === "error"
          ? "border-red-200 bg-red-50 text-red-700"
          : "border-emerald-200 bg-emerald-50 text-emerald-700"
      )}
    >
      {children}
    </p>
  );
}
