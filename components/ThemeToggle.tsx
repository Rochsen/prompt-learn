"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { applyTheme, readTheme, type ThemeMode } from "@/lib/theme";

export function ThemeToggle() {
  const [mode, setMode] = useState<ThemeMode>("dark");

  useEffect(() => {
    setMode(readTheme());
  }, []);

  function handleToggle() {
    const next: ThemeMode = mode === "dark" ? "light" : "dark";
    applyTheme(next);
    setMode(next);
  }

  return (
    <Button type="button" variant="ghost" size="sm" onClick={handleToggle}>
      {mode === "dark" ? "浅色" : "深色"}
    </Button>
  );
}
