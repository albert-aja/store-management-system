import { describe, expect, it } from "vitest";
import { hasValidCoordinates, routeGeometry, type MapPoint } from "./mapGeometry";

const point = (latitude: number, longitude: number): MapPoint => ({ id: `${latitude}`, label: "GPS point", latitude, longitude });

describe("map geometry", () => {
  it("accepts zero and boundary coordinates, rejects missing/out-of-range coordinates", () => {
    for (const value of [point(0, 0), point(-90, -180), point(90, 180)]) expect(hasValidCoordinates(value)).toBe(true);
    for (const value of [point(NaN, 10), point(10, Infinity), point(91, 0), point(0, -181)]) expect(hasValidCoordinates(value)).toBe(false);
  });

  it("plots longitude/latitude from real GPS points, not synthetic waypoints", () => {
    expect(routeGeometry([point(-6.1, 106.8), point(-6.2, 106.9)])).toEqual({
      type: "MultiLineString", coordinates: [[[106.8, -6.1], [106.9, -6.2]]],
    });
  });

  it("breaks routes at invalid records and handles empty/single point history", () => {
    expect(routeGeometry([point(1, 2), point(3, 4), point(NaN, 0), point(5, 6), point(7, 8)]).coordinates)
      .toEqual([[[2, 1], [4, 3]], [[6, 5], [8, 7]]]);
    expect(routeGeometry([]).coordinates).toEqual([]);
    expect(routeGeometry([point(0, 0)]).coordinates).toEqual([]);
  });
});
