export interface MapPoint {
  id: string;
  latitude: number;
  longitude: number;
  label: string;
  color?: string;
}

export function hasValidCoordinates(point: Pick<MapPoint, "latitude" | "longitude">): boolean {
  return Number.isFinite(point.latitude) && Math.abs(point.latitude) <= 90
    && Number.isFinite(point.longitude) && Math.abs(point.longitude) <= 180;
}

export function routeGeometry(points: MapPoint[]): { type: "MultiLineString"; coordinates: number[][][] } {
  const coordinates: number[][][] = [];
  let segment: number[][] = [];
  const flush = () => {
    if (segment.length > 1) coordinates.push(segment);
    segment = [];
  };
  for (const point of points) {
    if (hasValidCoordinates(point)) segment.push([point.longitude, point.latitude]);
    else flush();
  }
  flush();
  return { type: "MultiLineString", coordinates };
}
