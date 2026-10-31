import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeProvider } from "@mui/material";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import LocationMap from "./LocationMap";
import { getAppTheme } from "../theme";
import type { MapPoint } from "../lib/mapGeometry";

const mocks = vi.hoisted(() => ({
  create: vi.fn(), fit: vi.fn(), remove: vi.fn(), source: vi.fn(),
  fail: false, errors: [] as ((event: { error: Error }) => void)[],
}));
vi.mock("maplibre-gl", () => {
  class TestMap {
    route = false;
    options: { container: HTMLElement; style: unknown };
    constructor(options: { container: HTMLElement; style: unknown }) {
      this.options = options;
      mocks.create(options);
      if (mocks.fail) throw new Error("WebGL unavailable");
    }
    getContainer() { return this.options.container; }
    addControl() {}
    on(name: string, callback: (event: { error: Error }) => void) { if (name === "error") mocks.errors.push(callback); }
    once() {}
    off() {}
    resize() {}
    isStyleLoaded() { return true; }
    fitBounds(...args: unknown[]) { mocks.fit(...args); }
    addSource(...args: unknown[]) { mocks.source(...args); this.route = true; }
    addLayer() {}
    getLayer() { return this.route ? {} : undefined; }
    getSource() { return this.route ? {} : undefined; }
    removeLayer() {}
    removeSource() { this.route = false; }
    remove() { mocks.remove(); this.options.container.replaceChildren(); }
  }
  class TestMarker {
    options: { element: HTMLElement };
    constructor(options: { element: HTMLElement }) { this.options = options; }
    setLngLat() { return this; }
    addTo(map: TestMap) { map.getContainer().append(this.options.element); return this; }
    remove() { this.options.element.remove(); }
  }
  return { Map: TestMap, Marker: TestMarker, NavigationControl: class {}, setWorkerUrl: vi.fn() };
});

const points: MapPoint[] = [
  { id: "1", label: "Demo worker", latitude: -6.1, longitude: 106.8 },
  { id: "2", label: "Second worker", latitude: -6.2, longitude: 106.9 },
];
beforeEach(() => {
  vi.clearAllMocks();
  mocks.fail = false;
  mocks.errors.length = 0;
  vi.stubEnv("VITE_MAP_STYLE_URL", "");
  vi.stubGlobal("ResizeObserver", class { observe() {} disconnect() {} });
});
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

describe("MapLibre management maps", () => {
  it("uses local-only background when basemap is absent and keeps marker selection", async () => {
    const select = vi.fn();
    render(<LocationMap points={points} onSelect={select} selectedId="1" label="Live map" />);
    expect(screen.getByText(/Street basemap not configured/)).toBeInTheDocument();
    expect(mocks.create.mock.calls[0][0].style.sources).toEqual({});
    expect(screen.getByRole("button", { name: "Demo worker" })).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(screen.getByRole("button", { name: "Second worker" }));
    expect(select).toHaveBeenCalledWith("2");
    expect(mocks.fit).toHaveBeenCalledWith([[106.8, -6.2], [106.9, -6.1]], expect.objectContaining({ duration: 0 }));
  });

  it("uses configured self-hosted style and actual route coordinates", () => {
    vi.stubEnv("VITE_MAP_STYLE_URL", "https://maps.internal.test/style.json");
    render(<LocationMap points={points} showRoute label="Recorded route" />);
    expect(mocks.create.mock.calls[0][0].style).toBe("https://maps.internal.test/style.json");
    expect(mocks.source).toHaveBeenCalledWith("recorded-route", expect.objectContaining({
      data: { type: "Feature", properties: {}, geometry: {
        type: "MultiLineString", coordinates: [[[106.8, -6.1], [106.9, -6.2]]],
      } },
    }));
  });

  it("preserves camera on polling, cleans up, and fits again when theme changes", () => {
    const view = render(<ThemeProvider theme={getAppTheme("light")}><LocationMap points={points} label="Live map" /></ThemeProvider>);
    view.rerender(<ThemeProvider theme={getAppTheme("light")}><LocationMap points={[...points]} label="Live map" /></ThemeProvider>);
    expect(mocks.create).toHaveBeenCalledTimes(1);
    expect(mocks.fit).toHaveBeenCalledTimes(1);
    view.rerender(<ThemeProvider theme={getAppTheme("dark")}><LocationMap points={points} label="Live map" /></ThemeProvider>);
    expect(mocks.create).toHaveBeenCalledTimes(2);
    expect(mocks.fit).toHaveBeenCalledTimes(2);
    view.unmount();
    expect(mocks.remove).toHaveBeenCalledTimes(2);
  });

  it("shows invalid GPS warnings instead of inventing positions", () => {
    render(<LocationMap points={[{ ...points[0], latitude: NaN }]} label="Live map" />);
    expect(screen.getByText(/1 invalid GPS record/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Fit locations" })).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Demo worker" })).not.toBeInTheDocument();
  });

  it("surfaces unsupported WebGL errors while leaving records accessible", () => {
    mocks.fail = true;
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    render(<LocationMap points={points} label="Live map" />);
    expect(screen.getByText(/Map unavailable. Enable WebGL/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Fit locations" })).toBeDisabled();
    log.mockRestore();
  });
});
