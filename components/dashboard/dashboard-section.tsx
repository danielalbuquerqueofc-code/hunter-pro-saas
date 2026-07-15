import { cn } from "@/lib/utils";

type DashboardSectionProps = {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

export function DashboardSection({
  title,
  description,
  action,
  children,
  className
}: DashboardSectionProps) {
  return (
    <section className={cn("rounded-lg border border-zinc-200 bg-white p-5 shadow-sm", className)}>
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="font-black text-zinc-950">{title}</h2>
          {description ? <p className="mt-1 text-sm text-zinc-500">{description}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
