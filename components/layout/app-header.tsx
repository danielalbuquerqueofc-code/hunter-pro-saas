import { Button } from "@/components/ui/button";

type AppHeaderProps = {
  title: string;
  eyebrow?: string;
  actionLabel?: string;
  actionHref?: string;
};

export function AppHeader({ title, eyebrow, actionLabel, actionHref }: AppHeaderProps) {
  return (
    <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-8 py-5">
      <div>
        {eyebrow ? (
          <p className="text-xs font-bold uppercase tracking-wide text-zinc-500">{eyebrow}</p>
        ) : null}
        <h1 className="text-2xl font-bold text-zinc-950">{title}</h1>
      </div>
      {actionLabel && actionHref ? (
        <Button asChild>
          <a href={actionHref}>{actionLabel}</a>
        </Button>
      ) : null}
    </header>
  );
}
