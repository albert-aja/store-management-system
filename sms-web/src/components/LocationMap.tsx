import { useEffect, useRef, useState } from "react";
import { Alert, Box, Button, Stack, useTheme } from "@mui/material";
import { Map, Marker, NavigationControl, setWorkerUrl, type StyleSpecification } from "maplibre-gl";
import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";
import "maplibre-gl/dist/maplibre-gl.css";
import { hasValidCoordinates, routeGeometry, type MapPoint } from "../lib/mapGeometry";
import { t, useLanguage } from "../lib/locale";

setWorkerUrl(workerUrl);

interface LocationMapProps {
  points: MapPoint[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  showRoute?: boolean;
  height?: number | string;
  label: string;
}

export default function LocationMap({ points, selectedId, onSelect, showRoute = false, height = 440, label }: LocationMapProps) {
  const theme = useTheme();
  const language = useLanguage();
  const dark = theme.palette.mode === "dark";
  const primary = theme.palette.primary.main;
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const fitRef = useRef<() => void>(() => {});
  const [errorKey, setErrorKey] = useState<
    | "Map unavailable. Enable WebGL or use a supported browser. Location records remain available below."
    | "Map resources could not load. Check the self-hosted style URL, tiles, and CORS configuration."
    | null
  >(null);
  const error = errorKey ? t(errorKey, language) : null;
  const styleUrl = import.meta.env.VITE_MAP_STYLE_URL?.trim() || "";
  const invalidCount = points.filter((point) => !hasValidCoordinates(point)).length;

  useEffect(() => {
    if (!container.current) return;
    const localStyle: StyleSpecification = {
      version: 8,
      sources: {},
      layers: [{ id: "background", type: "background", paint: { "background-color": dark ? "#162338" : "#eef2f6" } }],
    };
    let map: Map;
    try {
      map = new Map({
        container: container.current,
        style: styleUrl || localStyle,
        center: [0, 0],
        zoom: 1,
        attributionControl: {},
        locale: {
          "NavigationControl.ZoomIn": t("Zoom in", language),
          "NavigationControl.ZoomOut": t("Zoom out", language),
          "NavigationControl.ResetBearing": t("Reset bearing to north", language),
        },
      });
    } catch (cause) {
      console.error("Unable to initialize management map:", cause);
      // MapLibre reports unsupported WebGL synchronously, before it can emit an error event.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setErrorKey("Map unavailable. Enable WebGL or use a supported browser. Location records remain available below.");
      return;
    }
    mapRef.current = map;
    delete map.getContainer().dataset.fitted;
    map.on("load", () => setErrorKey(null));
    map.addControl(new NavigationControl({ showCompass: true }), "top-right");
    const resize = new ResizeObserver(() => map.resize());
    resize.observe(container.current);
    map.on("error", (event) => {
      console.error("Management map failed to load:", event.error);
      setErrorKey("Map resources could not load. Check the self-hosted style URL, tiles, and CORS configuration.");
    });
    return () => {
      resize.disconnect();
      mapRef.current = null;
      map.remove();
    };
  }, [styleUrl, dark, language]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const validPoints = points.filter(hasValidCoordinates);
    const markers: Marker[] = [];
    const fit = () => {
      if (!validPoints.length) return;
      const lons = validPoints.map((point) => point.longitude);
      const lats = validPoints.map((point) => point.latitude);
      map.fitBounds(
        [[Math.min(...lons), Math.min(...lats)], [Math.max(...lons), Math.max(...lats)]],
        { padding: 64, maxZoom: 15, duration: 0 },
      );
    };
    fitRef.current = fit;
    const draw = () => {
      const markerPoints = showRoute
        ? validPoints.filter((point, index) => index === 0 || index === validPoints.length - 1 || point.id === selectedId)
        : validPoints;
      for (const point of markerPoints) {
        const element = document.createElement("button");
        element.type = "button";
        element.className = "management-map-marker";
        element.textContent = point.label.split(" ").slice(0, 2).map((part) => part[0]).join("");
        element.setAttribute("aria-label", point.label);
        element.setAttribute("aria-pressed", String(point.id === selectedId));
        element.style.backgroundColor = point.color || primary;
        element.addEventListener("click", () => onSelect?.(point.id));
        markers.push(new Marker({ element }).setLngLat([point.longitude, point.latitude]).addTo(map));
      }
      if (showRoute) {
        map.addSource("recorded-route", {
          type: "geojson",
          data: { type: "Feature", properties: {}, geometry: routeGeometry(points) },
        });
        map.addLayer({
          id: "recorded-route", type: "line", source: "recorded-route",
          layout: { "line-join": "round", "line-cap": "round" },
          paint: { "line-color": primary, "line-width": 3 },
        });
      }
      // Fit new datasets, but preserve user zoom/pan during live polling and playback.
      if (!map.getContainer().dataset.fitted) {
        fit();
        if (validPoints.length) map.getContainer().dataset.fitted = "true";
      }
    };
    if (map.isStyleLoaded()) draw();
    else map.once("load", draw);
    return () => {
      map.off("load", draw);
      markers.forEach((marker) => marker.remove());
      if (mapRef.current === map) {
        if (map.getLayer("recorded-route")) map.removeLayer("recorded-route");
        if (map.getSource("recorded-route")) map.removeSource("recorded-route");
      }
    };
  }, [points, selectedId, onSelect, showRoute, primary, styleUrl, dark]);

  return (
    <Stack spacing={1.5} sx={{ minWidth: 0, "& .MuiAlert-message": { minWidth: 0, overflowWrap: "anywhere" } }}>
      {!styleUrl && <Alert severity="info">{t("Street basemap not configured. Showing GPS positions only; set VITE_MAP_STYLE_URL to a self-hosted MapLibre style.", language)}</Alert>}
      {invalidCount > 0 && <Alert severity="warning">{invalidCount} {t("invalid GPS record(s) cannot be plotted. Route lines stop at missing coordinates.", language)}</Alert>}
      {error && <Alert severity="error">{error}</Alert>}
      {!points.length && <Alert severity="info">{t("No location records available.", language)}</Alert>}
      <Box sx={{ position: "relative", height, border: 1, borderColor: "divider", borderRadius: 2, overflow: "hidden" }}>
        <Box ref={container} className="management-map" role="region" aria-label={label} />
        <Button size="small" variant="outlined" onClick={() => fitRef.current()} disabled={!!error || points.length === invalidCount}
          sx={{ position: "absolute", top: 12, left: 12, bgcolor: "background.paper" }}>{t("Fit locations", language)}</Button>
      </Box>
    </Stack>
  );
}
