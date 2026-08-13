"use client";

import { useMemo, useState } from "react";
import { WORLD_LAND_PATH } from "@/lib/world-land-path";
import { buildCoachMapMarkers, WORLD_MAP } from "@/lib/world-map";
import type { CoachMapPoint } from "@/lib/types";

type CoachMapProps = {
  points: CoachMapPoint[];
  activeCountry: string | null;
  onCountrySelect: (country: string | null) => void;
};

const LEGEND_COUNTS = [1, 10, 50];

export function CoachMap({ points, activeCountry, onCountrySelect }: CoachMapProps) {
  const markers = useMemo(() => buildCoachMapMarkers(points), [points]);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const hovered = hoveredIndex === null ? null : markers[hoveredIndex];

  function toggleCountry(country: string | null) {
    if (!country) {
      return;
    }
    onCountrySelect(activeCountry === country ? null : country);
  }

  return (
    <div className="coach-map-figure">
      <svg
        aria-hidden="false"
        className="coach-map-svg"
        role="group"
        aria-label="World map of coach locations. Select a marker to filter the directory by country."
        viewBox={`0 0 ${WORLD_MAP.width} ${WORLD_MAP.height}`}
      >
        <path className="coach-map-land" d={WORLD_LAND_PATH} />
        {markers.map((marker, index) => {
          const isActive = activeCountry !== null && marker.country === activeCountry;
          const isDimmed = activeCountry !== null && !isActive;
          const coachLabel = `${marker.count} ${marker.count === 1 ? "coach" : "coaches"}`;
          return (
            <g
              className={`coach-map-marker${isDimmed ? " is-dimmed" : ""}${isActive ? " is-active" : ""}`}
              key={`${marker.label}-${index}`}
            >
              {/* generous invisible hit target around the visible dot */}
              <circle
                aria-label={`${marker.label}: ${coachLabel}. ${
                  isActive ? "Clear the country filter." : "Filter the directory."
                }`}
                aria-pressed={isActive}
                className="coach-map-hit"
                cx={marker.x}
                cy={marker.y}
                onBlur={() => setHoveredIndex(null)}
                onClick={() => toggleCountry(marker.country)}
                onFocus={() => setHoveredIndex(index)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    toggleCountry(marker.country);
                  }
                }}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                r={marker.r + 7}
                role="button"
                tabIndex={0}
              />
              <circle
                className="coach-map-dot"
                cx={marker.x}
                cy={marker.y}
                r={marker.r}
              />
              {marker.r >= 10 ? (
                <text
                  className="coach-map-dot-label"
                  textAnchor="middle"
                  x={marker.x}
                  y={marker.y}
                >
                  {marker.count}
                </text>
              ) : null}
            </g>
          );
        })}
      </svg>

      {hovered ? (
        <div
          className="coach-map-tooltip"
          style={{
            left: `${(hovered.x / WORLD_MAP.width) * 100}%`,
            top: `${(hovered.y / WORLD_MAP.height) * 100}%`,
          }}
        >
          <strong>{hovered.label}</strong>
          <span>
            {hovered.count} {hovered.count === 1 ? "coach" : "coaches"}
          </span>
        </div>
      ) : null}

      <div className="coach-map-footer">
        <div aria-hidden="true" className="coach-map-legend">
          {LEGEND_COUNTS.map((count) => (
            <span className="coach-map-legend-item" key={count}>
              <svg
                height={16}
                viewBox="0 0 16 16"
                width={16}
              >
                <circle
                  className="coach-map-dot"
                  cx={8}
                  cy={8}
                  r={Math.min(7, Math.max(2.5, 1.4 * Math.sqrt(count) + 1))}
                />
              </svg>
              {count}
            </span>
          ))}
          <span className="coach-map-legend-caption">coaches per location</span>
        </div>
        {activeCountry ? (
          <button
            className="coach-map-clear"
            onClick={() => onCountrySelect(null)}
            type="button"
          >
            Showing {activeCountry} — clear
          </button>
        ) : (
          <span className="coach-map-hint">Select a marker to see coaches from that country.</span>
        )}
      </div>
    </div>
  );
}
