import { describe, expect, it, beforeEach } from "vitest";
import { useThemeStore } from "./themeStore";

describe("themeStore", () => {
  beforeEach(() => {
    localStorage.clear();
    useThemeStore.setState({ mode: "light" });
  });

  it("initializes with light mode by default", () => {
    expect(useThemeStore.getState().mode).toBe("light");
  });

  it("toggles theme between light and dark", () => {
    useThemeStore.getState().toggleTheme();
    expect(useThemeStore.getState().mode).toBe("dark");

    useThemeStore.getState().toggleTheme();
    expect(useThemeStore.getState().mode).toBe("light");
  });

  it("sets specific mode directly", () => {
    useThemeStore.getState().setMode("dark");
    expect(useThemeStore.getState().mode).toBe("dark");
  });
});

