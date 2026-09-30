import { describe, expect, it } from "vitest";
import {
  buildCoachMapMarkers,
  coachCountryKey,
  distanceKm,
  MARKER_RADIUS,
  projectToWorldMap,
  WORLD_MAP,
} from "./world-map";
import { COUNTRY_CENTROIDS } from "./country-centroids";
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

describe("buildCoachMapMarkers", () => {
  it("aggregates a country into one marker regardless of distance", () => {
    const nyc = projectToWorldMap(40.71, -74.01);
    const sf = projectToWorldMap(37.77, -122.42);
    const markers = buildCoachMapMarkers([
      point({ country: "United States", city: "New York", lat: 40.71, lng: -74.01, count: 30 }),
      point({ country: "United States", city: "San Francisco", lat: 37.77, lng: -122.42, count: 10 }),
    ]);
    expect(markers).toHaveLength(1);
    expect(markers[0].hasCoaches).toBe(true);
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
    expect(markers[0]).not.toHaveProperty("count");
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
    const [first, second] = markers;
    const distance = Math.hypot(first.x - second.x, first.y - second.y);
    expect(distance).toBeGreaterThanOrEqual(2 * MARKER_RADIUS + 2 - 0.01);
    expect(Math.hypot(first.x - sg.x, first.y - sg.y)).toBeLessThanOrEqual(30.01);
    expect(Math.hypot(second.x - kl.x, second.y - kl.y)).toBeLessThanOrEqual(30.01);
  });

  it("keeps input order for coach markers regardless of coach counts", () => {
    const markers = buildCoachMapMarkers([
      point({ country: "Japan", city: "Tokyo", lat: 35.7, lng: 139.7, count: 1 }),
      point({ country: "China", lat: 35, lng: 103, count: 62 }),
    ]);
    expect(markers.map((marker) => marker.country)).toEqual(["Japan", "China"]);
  });

  it("attaches an affiliate to its country's coach marker", () => {
    const markers = buildCoachMapMarkers(
      [point({ country: "Viet Nam", city: "Hanoi", lat: 21.03, lng: 105.85, count: 12 })],
      [{ name: "WIAL Vietnam", country: "Vietnam", href: "http://www.wialvietnam.com/" }],
    );
    expect(markers).toHaveLength(1);
    expect(markers[0].affiliate).toEqual({ name: "WIAL Vietnam" });
    expect(markers[0].hasCoaches).toBe(true);
  });

  it("leaves affiliate null on countries without one", () => {
    const markers = buildCoachMapMarkers(
      [point({ country: "Belgium", city: "Antwerp", lat: 51.22, lng: 4.4, count: 3 })],
      [{ name: "WIAL Vietnam", country: "Vietnam", href: "http://www.wialvietnam.com/" }],
    );
    expect(markers[0].affiliate).toBeNull();
  });

  it("adds a marker for an affiliate country with no coaches", () => {
    const markers = buildCoachMapMarkers(
      [],
      [{ name: "WIAL Singapore", country: "Singapore", href: "https://www.wial.sg/" }],
    );
    expect(markers).toHaveLength(1);
    expect(markers[0].hasCoaches).toBe(false);
    expect(markers[0].country).toBe("Singapore");
    expect(markers[0].countryCode).toBe("sg");
    expect(markers[0].affiliate).toEqual({ name: "WIAL Singapore" });
    // Anchored near the vendored Singapore label point (1.37, 103.82).
    const anchor = projectToWorldMap(1.37, 103.82);
    expect(markers[0].x).toBeCloseTo(anchor.x, 0);
    expect(markers[0].y).toBeCloseTo(anchor.y, 0);
  });

  it("skips map markers for affiliates whose country has no ISO code", () => {
    const markers = buildCoachMapMarkers(
      [],
      [{ name: "WIAL Atlantis", country: "Atlantis", href: "https://example.org/" }],
    );
    expect(markers).toHaveLength(0);
  });

  it("lists affiliate-only markers after coach markers", () => {
    const markers = buildCoachMapMarkers(
      [point({ country: "Malaysia", city: "Kuala Lumpur", lat: 3.14, lng: 101.69, count: 20 })],
      [{ name: "WIAL Singapore", country: "Singapore", href: "https://www.wial.sg/" }],
    );
    expect(markers.map((marker) => marker.hasCoaches)).toEqual([true, false]);
  });
});

describe("buildCoachMapMarkers anchor plausibility", () => {
  it("leaves a point implausibly far from its country out of the anchor", () => {
    // A directory profile tagged Switzerland but geocoded in Montreal used to
    // pull the Swiss dot into the middle of the Atlantic.
    const zurich = projectToWorldMap(47.38, 8.54);
    const markers = buildCoachMapMarkers([
      point({ country: "Switzerland", city: "Zürich", lat: 47.38, lng: 8.54 }),
      point({ country: "Switzerland", city: "Montreal", lat: 45.5, lng: -73.57 }),
    ]);
    expect(markers).toHaveLength(1);
    expect(markers[0].countryCode).toBe("ch");
    expect(markers[0].hasCoaches).toBe(true);
    expect(markers[0].x).toBeCloseTo(zurich.x, 5);
    expect(markers[0].y).toBeCloseTo(zurich.y, 5);
  });

  it("anchors a country at its vendored label point when none of its points are plausible", () => {
    const home = projectToWorldMap(COUNTRY_CENTROIDS.fi.lat, COUNTRY_CENTROIDS.fi.lng);
    const markers = buildCoachMapMarkers([
      // Tagged Finland, geocoded in Accra.
      point({ country: "Finland", lat: 5.55, lng: -0.2 }),
    ]);
    expect(markers).toHaveLength(1);
    expect(markers[0].hasCoaches).toBe(true);
    expect(markers[0].countryCode).toBe("fi");
    expect(markers[0].x).toBeCloseTo(home.x, 5);
    expect(markers[0].y).toBeCloseTo(home.y, 5);
  });

  it("keeps far-apart domestic points and unknown countries on the weighted centroid", () => {
    const usa = buildCoachMapMarkers([
      point({ country: "United States", city: "New York", lat: 40.71, lng: -74.01 }),
      point({ country: "United States", city: "San Francisco", lat: 37.77, lng: -122.42 }),
    ]);
    const usaMid = projectToWorldMap((40.71 + 37.77) / 2, (-74.01 - 122.42) / 2);
    expect(usa[0].x).toBeCloseTo(usaMid.x, 5);
    expect(usa[0].y).toBeCloseTo(usaMid.y, 5);

    // No vendored label point to check against, so nothing is filtered.
    const unknown = buildCoachMapMarkers([
      point({ country: "Atlantis", lat: 10, lng: 10 }),
      point({ country: "Atlantis", lat: -10, lng: -170 }),
    ]);
    const unknownMid = projectToWorldMap(0, -80);
    expect(unknown[0].countryCode).toBeNull();
    expect(unknown[0].x).toBeCloseTo(unknownMid.x, 5);
    expect(unknown[0].y).toBeCloseTo(unknownMid.y, 5);
  });
});

describe("distanceKm", () => {
  it("measures great-circle distance", () => {
    // Montreal → Switzerland's label point.
    expect(distanceKm({ lat: 45.5, lng: -73.57 }, { lat: 46.72, lng: 7.46 })).toBeCloseTo(5954, -2);
    expect(distanceKm({ lat: 0, lng: 0 }, { lat: 0, lng: 0 })).toBe(0);
  });
});
