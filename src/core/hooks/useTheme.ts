import { useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";

function applyTheme(theme: Theme, systemDark: boolean) {
  const effective = theme === "system" ? (systemDark ? "dark" : "light") : theme;
  document.documentElement.setAttribute("data-theme", effective);
  document.body.setAttribute("data-theme", effective);
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem("tema") as Theme) ?? "system";
  });

  const [systemDark, setSystemDark] = useState(
    () => window.matchMedia("(prefers-color-scheme: dark)").matches
  );

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    applyTheme(theme, systemDark);
    localStorage.setItem("tema", theme);
  }, [theme, systemDark]);

  const isDark = theme === "dark" || (theme === "system" && systemDark);

  return { theme, setTheme, isDark };
}
