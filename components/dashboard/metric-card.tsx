import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowUpRight, Minus, TrendingDown, TrendingUp } from "lucide-react";

const trendIcon = {
  positive: TrendingUp,
  negative: TrendingDown,
  neutral: Minus
};

const trendClass = {
  positive: "text-emerald-600",
  negative: "text-red-600",
  neutral: "text-zinc-500"
};

type MetricCardProps = {
  title: string;
  value: string;
  comparison: string;
  trend: "positive" | "negative" | "neutral";
  href: string;
  icon: LucideIcon;
};

export function MetricCard({
  title,
  value,
  comparison,
  trend,
  href,
  icon: Icon
}: MetricCardProps) {
  const TrendIcon = trendIcon[trend];

  return (
    <Link
      href={href}
      className="group rounded-lg border border-zinc-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-4">
        <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-orange-50 text-brand-orange">
          <Icon className="h-5 w-5" />
        </span>
        <ArrowUpRight className="h-4 w-4 text-zinc-400 transition group-hover:text-brand-orange" />
      </div>
      <p className="mt-5 text-sm font-bold text-zinc-500">{title}</p>
      <strong className="mt-2 block text-2xl font-black tracking-tight">{value}</strong>
      <p className={`mt-3 flex items-center gap-1 text-xs font-bold ${trendClass[trend]}`}>
        <TrendIcon className="h-4 w-4" />
        {comparison}
      </p>
    </Link>
  );
}
