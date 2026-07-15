import { AlertTriangle } from "lucide-react";

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-5 text-sm font-semibold text-red-700">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-5 w-5" />
        {message}
      </div>
    </div>
  );
}
