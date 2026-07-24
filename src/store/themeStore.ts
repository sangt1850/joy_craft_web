import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Theme = "default" | "pastel" | "dark" | "mono";

export const THEMES: { id: Theme; label: string }[] = [
  { id: "default", label: "Y2K Bright" },
  { id: "pastel",  label: "파스텔" },
  { id: "dark",    label: "다크" },
  { id: "mono",    label: "모노" },
];

interface ThemeStore {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

function applyTheme(theme: Theme) {
  if (theme === "default") {
    document.documentElement.removeAttribute("data-theme");
  } else {
    document.documentElement.setAttribute("data-theme", theme);
  }
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set) => ({
      theme: "default",
      setTheme: (theme) => {
        applyTheme(theme);
        set({ theme });
      },
    }),
    {
      name: "joycraft-theme",
      onRehydrateStorage: () => (state) => {
        // 새로고침 후 저장된 테마 복원
        if (state?.theme) applyTheme(state.theme);
      },
    }
  )
);
