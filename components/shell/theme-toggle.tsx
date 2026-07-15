"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  return (
    <button
      className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 hover:bg-white/25"
      type="button"
      onClick={() => setDark((value) => !value)}
      aria-label="Alternar tema"
    >
      {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>
  );
}
