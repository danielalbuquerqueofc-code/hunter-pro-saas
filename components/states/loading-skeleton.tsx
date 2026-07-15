export function LoadingSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="h-4 animate-pulse rounded bg-zinc-200" />
      ))}
    </div>
  );
}
