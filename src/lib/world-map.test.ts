import { describe, expect, it } from "vitest";
import {
  buildCoachMapMarkers,
  coachCountryKey,
  markerRadius,
  projectToWorldMap,
  WORLD_MAP,
} from "./world-map";
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

describe("coachCountryKey", () => {
  it("canonicalizes spelling variants to one key", () => {
    expect(coachCountryKey("Vietnam")).toBe("vn");
    expect(coachCountryKey("Viet Nam")).toBe("vn");
    expect(coachCountryKey("Hong Kong")).toBe("hk");
    expect(coachCountryKey("Syrian Arab Republic")).toBe("sy");
  });

  it("falls back to normalized text for unknown countries and null for none", () => {
    expect(coachCountryKey(" Atlantis ")).toBe("atlantis");
    expect(coachCountryKey(null)).toBeNull();
  });
});

describe("markerRadius", () => {
  it("clamps between 6 and 26 and grows with count", () => {
    expect(markerRadius(1)).toBeCloseTo(6.2, 1);
    expect(markerRadius(86)).toBeCloseTo(24.4, 1);
    expect(markerRadius(500)).toBe(26);
    expect(markerRadius(0)).toBe(6);
  });
});

describe("buildCoachMapMarkers", () => {
  it("aggregates a country into one marker regardless of distance", () => {
    const nyc = projectToWorldMap(40.71, -74.01);
    const sf = projectToWorldMap(37.77, -122.42);
    const markers = buildCoachMapMarkers([
      point({ country: "United States", city: "New York", lat: 40.71, lng: -74.01, count: 30 }),
      point({ country: "United States", city: "San Francisco", lat: 37.77, lng: -122.42, count: 10 }),
    ]);
    expect(markers).toHaveLength(1);
    expect(markers[0].count).toBe(40);
    expect(markers[0].cityCount).toBe(2);
    expect(markers[0].countryCode).toBe("us");
    // Count-weighted centroid sits between the cities, closer to the larger crowd.
    expect(markers[0].x).toBeGreaterThan(sf.x);
    expect(markers[0].x).toBeLessThan(nyc.x);
    expect(Math.abs(markers[0].x - nyc.x)).toBeLessThan(Math.abs(markers[0].x - sf.x));
  });

  it("merges spelling variants and keeps the most common raw string for filtering", () => {
    const markers = buildCoachMapMarkers([
      point({ country: "Vietnam", city: "Hanoi", lat: 21.03, lng: 105.85, count: 30 }),
      point({ country: "Viet Nam", city: "Ho Chi Minh City", lat: 10.82, lng: 106.63, count: 9 }),
    ]);
    expect(markers).toHaveLength(1);
    expect(markers[0].country).toBe("Vietnam");
    expect(markers[0].countryCode).toBe("vn");
  });

  it("keeps different countries separate", () => {
    const markers = buildCoachMapMarkers([
      point({ country: "Netherlands", city: "Amsterdam", lat: 52.37, lng: 4.9, count: 10 }),
      point({ country: "Belgium", city: "Antwerp", lat: 51.22, lng: 4.4, count: 3 }),
    ]);
    expect(markers).toHaveLength(2);
  });

  it("labels markers with the country name only", () => {
    const markers = buildCoachMapMarkers([
      point({ country: "Thailand", city: "Bangkok", lat: 13.76, lng: 100.5, count: 22 }),
    ]);
    expect(markers[0].label).toBe("Thailand");
    expect(markers[0].cityCount).toBe(1);
  });

  it("drops points without a country", () => {
    const markers = buildCoachMapMarkers([
      point({ country: null, city: "Somewhere", lat: 10, lng: 10, count: 4 }),
      point({ country: "Thailand", city: "Bangkok", lat: 13.76, lng: 100.5, count: 22 }),
    ]);
    expect(markers).toHaveLength(1);
    expect(markers[0].country).toBe("Thailand");
  });

  it("pushes overlapping neighbors apart without drifting far from their anchors", () => {
    const sg = projectToWorldMap(1.35, 103.82);
    const kl = projectToWorldMap(3.14, 101.69);
    const markers = buildCoachMapMarkers([
      point({ country: "Singapore", city: "Singapore", lat: 1.35, lng: 103.82, count: 5 }),
      point({ country: "Malaysia", city: "Kuala Lumpur", lat: 3.14, lng: 101.69, count: 54 }),
    ]);
    const [big, small] = markers;
    const distance = Math.hypot(big.x - small.x, big.y - small.y);
    expect(distance).toBeGreaterThanOrEqual(big.r + small.r + 2 - 0.01);
    expect(Math.hypot(small.x - sg.x, small.y - sg.y)).toBeLessThanOrEqual(30.01);
    expect(Math.hypot(big.x - kl.x, big.y - kl.y)).toBeLessThanOrEqual(30.01);
  });

  it("paints large markers before small ones", () => {
    const markers = buildCoachMapMarkers([
      point({ country: "Japan", city: "Tokyo", lat: 35.7, lng: 139.7, count: 1 }),
      point({ country: "China", lat: 35, lng: 103, count: 62 }),
    ]);
    expect(markers[0].count).toBe(62);
    expect(markers[1].count).toBe(1);
  });
});
