import Link from "next/link";
import { Bell } from "lucide-react";

export function NotificationCenter() {
  return (
    <Link
      href="/tarefas"
      className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white/15 hover:bg-white/25"
      aria-label="Central de notificacoes"
    >
      <Bell className="h-5 w-5" />
      <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-amber-300" />
    </Link>
  );
}
