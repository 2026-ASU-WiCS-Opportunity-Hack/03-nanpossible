import { describe, expect, it } from "vitest";
import { buildCoachMapMarkers, projectToWorldMap, WORLD_MAP } from "./world-map";
import type { CoachMapPoint } from "./types";

function point(overrides: Partial<CoachMapPoint>): CoachMapPoint {
  return { city: null, country: null, lat: 0, lng: 0, count: 1, ...overrides };
}

describe("projectToWorldMap", () => {
  it("maps the north-west crop corner to the origin", () => {
    expect(projectToWorldMap(84, -180)).toEqual({ x: 0, y: 0 });
  });

  it("maps the equator/greenwich to the horizontal center", () => {
    const { x, y } = projectToWorldMap(0, 0);
    expect(x).toBeCloseTo(WORLD_MAP.width / 2);
    expect(y).toBeCloseTo((84 / 360) * WORLD_MAP.width);
  });

  it("keeps every real coach latitude inside the viewBox", () => {
    for (const [lat, lng] of [
      [64.9, -18.6], // Iceland
      [-41.3, 174.8], // Wellington
      [-33.9, 18.4], // Cape Town
    ]) {
      const { x, y } = projectToWorldMap(lat, lng);
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThanOrEqual(WORLD_MAP.width);
      expect(y).toBeGreaterThanOrEqual(0);
      expect(y).toBeLessThanOrEqual(WORLD_MAP.height);
    }
  });
});

describe("buildCoachMapMarkers", () => {
  it("merges colliding same-country points and keeps their total", () => {
    const markers = buildCoachMapMarkers([
      point({ country: "Netherlands", city: "Amsterdam", lat: 52.37, lng: 4.9, count: 10 }),
      point({ country: "Netherlands", city: "Utrecht", lat: 52.09, lng: 5.12, count: 3 }),
    ]);
    expect(markers).toHaveLength(1);
    expect(markers[0].count).toBe(13);
    expect(markers[0].label).toBe("Netherlands · 2 cities");
  });

  it("keeps colliding points from different countries separate", () => {
    const markers = buildCoachMapMarkers([
      point({ country: "Netherlands", city: "Amsterdam", lat: 52.37, lng: 4.9, count: 10 }),
      point({ country: "Belgium", city: "Antwerp", lat: 51.22, lng: 4.4, count: 3 }),
    ]);
    expect(markers).toHaveLength(2);
  });

  it("labels single-city markers as city, country", () => {
    const markers = buildCoachMapMarkers([
      point({ country: "Thailand", city: "Bangkok", lat: 13.76, lng: 100.5, count: 22 }),
    ]);
    expect(markers[0].label).toBe("Bangkok, Thailand");
  });

  it("scales radius with count and caps it", () => {
    const [small] = buildCoachMapMarkers([point({ lat: 10, lng: 10, count: 1 })]);
    const [large] = buildCoachMapMarkers([point({ lat: 10, lng: 10, count: 500 })]);
    expect(small.r).toBeGreaterThanOrEqual(4);
    expect(large.r).toBeGreaterThan(small.r);
    expect(large.r).toBeLessThanOrEqual(16);
  });

  it("paints large markers before small ones", () => {
    const markers = buildCoachMapMarkers([
      point({ country: "China", lat: 35, lng: 103, count: 62 }),
      point({ country: "Japan", city: "Tokyo", lat: 35.7, lng: 139.7, count: 1 }),
    ]);
    expect(markers[0].count).toBe(62);
    expect(markers[1].count).toBe(1);
  });
});
