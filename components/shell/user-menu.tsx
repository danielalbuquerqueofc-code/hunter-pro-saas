import Link from "next/link";
import { LogOut, UserCircle } from "lucide-react";
import { signOutAction } from "@/features/auth/actions";

export function UserMenu({ email, userName }: { email?: string | null; userName?: string | null }) {
  return (
    <div className="group relative hidden md:block">
      <button
        className="flex h-10 items-center gap-2 rounded-full bg-white px-3 text-sm font-black text-brand-orange shadow-sm"
        type="button"
      >
        <UserCircle className="h-5 w-5" />
        {userName?.split(" ")[0] ?? "Perfil"}
      </button>
      <div className="invisible absolute right-0 top-12 z-50 w-64 rounded-lg border border-zinc-200 bg-white p-3 text-zinc-800 opacity-0 shadow-xl transition group-hover:visible group-hover:opacity-100">
        <p className="text-xs font-black uppercase text-zinc-400">Usuario</p>
        <p className="mt-1 truncate text-sm font-black">{userName ?? "Usuario"}</p>
        <p className="truncate text-xs font-bold text-zinc-500">{email ?? "Sem e-mail"}</p>
        <Link
          href="/minha-conta"
          className="mt-3 flex w-full items-center gap-2 rounded-md bg-zinc-100 px-3 py-2 text-sm font-bold hover:bg-orange-50 hover:text-brand-orange"
        >
          <UserCircle className="h-4 w-4" />
          Minha conta
        </Link>
        <form action={signOutAction} className="mt-3">
          <button
            className="flex w-full items-center gap-2 rounded-md bg-zinc-100 px-3 py-2 text-sm font-bold hover:bg-orange-50 hover:text-brand-orange"
            type="submit"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </button>
        </form>
      </div>
    </div>
  );
}
