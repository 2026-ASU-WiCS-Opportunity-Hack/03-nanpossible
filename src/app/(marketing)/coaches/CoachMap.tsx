"use client";

import { useMemo, useState } from "react";
import { countryFlagSrc } from "@/lib/countries";
import { WORLD_LAND_PATH } from "@/lib/world-land-path";
import { buildCoachMapMarkers, markerRadius, WORLD_MAP } from "@/lib/world-map";
import type { CoachMapPoint } from "@/lib/types";

type CoachMapProps = {
  points: CoachMapPoint[];
  activeCountry: string | null;
  onCountrySelect: (country: string | null) => void;
};

const LEGEND_COUNTS = [1, 10, 50];
const LEGEND_SCALE = 0.6;
const LEGEND_BOX = Math.ceil(2 * markerRadius(Math.max(...LEGEND_COUNTS)) * LEGEND_SCALE);

export function CoachMap({ points, activeCountry, onCountrySelect }: CoachMapProps) {
  const markers = useMemo(() => buildCoachMapMarkers(points), [points]);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const hovered = hoveredIndex === null ? null : markers[hoveredIndex];
  const hoveredFlag = hovered ? countryFlagSrc(hovered.countryCode) : null;

  function toggleCountry(country: string) {
    onCountrySelect(activeCountry === country ? null : country);
  }

  return (
    <div className="coach-map-figure">
      <svg
        aria-hidden="false"
        className="coach-map-svg"
        role="group"
        aria-label="World map of coach locations. Select a country to filter the directory."
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
                r={Math.max(marker.r + 6, 14)}
                role="button"
                tabIndex={0}
              />
              <circle
                className="coach-map-dot"
                cx={marker.x}
                cy={marker.y}
                r={marker.r}
              />
              {marker.r >= 9 ? (
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
          aria-hidden="true"
          className="coach-map-tooltip"
          style={{
            left: `${(hovered.x / WORLD_MAP.width) * 100}%`,
            top: `${(hovered.y / WORLD_MAP.height) * 100}%`,
          }}
        >
          <strong>
            {hoveredFlag ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img alt="" height={14} src={hoveredFlag} width={20} />
            ) : null}
            {hovered.label}
          </strong>
          <span>
            {hovered.count} {hovered.count === 1 ? "coach" : "coaches"}
            {hovered.cityCount > 1 ? ` · ${hovered.cityCount} cities` : ""}
          </span>
          <span>
            {activeCountry === hovered.country ? "Click to clear" : "Click to filter"}
          </span>
        </div>
      ) : null}

      <div className="coach-map-footer">
        <div aria-hidden="true" className="coach-map-legend">
          {LEGEND_COUNTS.map((count) => (
            <span className="coach-map-legend-item" key={count}>
              <svg
                height={LEGEND_BOX}
                viewBox={`0 0 ${LEGEND_BOX} ${LEGEND_BOX}`}
                width={LEGEND_BOX}
              >
                <circle
                  className="coach-map-dot"
                  cx={LEGEND_BOX / 2}
                  cy={LEGEND_BOX / 2}
                  r={markerRadius(count) * LEGEND_SCALE}
                />
              </svg>
              {count}
            </span>
          ))}
          <span className="coach-map-legend-caption">coaches per country</span>
        </div>
        <div aria-live="polite">
          {activeCountry ? (
            <button
              className="coach-map-clear"
              onClick={() => onCountrySelect(null)}
              type="button"
            >
              Showing {activeCountry} — clear
            </button>
          ) : (
            <span className="coach-map-hint">Select a country to see its coaches.</span>
          )}
        </div>
      </div>
    </div>
  );
}
