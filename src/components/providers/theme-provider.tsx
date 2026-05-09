"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Palette = "concrete" | "electric" | "terracotta";
type Density = "regular" | "compact";

interface ThemeContextValue {
  palette: Palette;
  density: Density;
  setPalette: (p: Palette) => void;
  setDensity: (d: Density) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [palette, setPaletteState] = useState<Palette>("concrete");
  const [density, setDensityState] = useState<Density>("regular");

  useEffect(() => {
    const savedPalette = localStorage.getItem("palette") as Palette | null;
    const savedDensity = localStorage.getItem("density") as Density | null;

    if (savedPalette) setPaletteState(savedPalette);
    if (savedDensity) setDensityState(savedDensity);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.palette = palette;
    localStorage.setItem("palette", palette);
  }, [palette]);

  useEffect(() => {
    document.documentElement.dataset.density = density;
    localStorage.setItem("density", density);
  }, [density]);

  function setPalette(p: Palette) {
    setPaletteState(p);
  }

  function setDensity(d: Density) {
    setDensityState(d);
  }

  return (
    <ThemeContext.Provider value={{ palette, density, setPalette, setDensity }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
