"use client";

import { useState } from "react";
import { countryFlagSrc } from "@/lib/countries";
import { WORLD_LAND_PATH } from "@/lib/world-land-path";
import { MARKER_RADIUS, WORLD_MAP, type CoachMapMarker } from "@/lib/world-map";

type NetworkMapProps = {
  markers: CoachMapMarker[];
};

const LEGEND_BOX = 2 * MARKER_RADIUS + 8;

function markerDescription(marker: CoachMapMarker) {
  const parts: string[] = [];
  if (marker.hasCoaches) {
    parts.push("WIAL-certified coaches");
  }
  if (marker.affiliate) {
    parts.push(`Home of ${marker.affiliate.name}`);
  }
  return parts.join(". ");
}

/**
 * Dependency-free SVG world map: one same-sized dot per country where WIAL
 * coaches are based, ringed when a WIAL affiliate is headquartered there.
 * Hover or focus a dot to see the country and its affiliate.
 */
export function NetworkMap({ markers }: NetworkMapProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const hovered = hoveredIndex === null ? null : markers[hoveredIndex];
  const hoveredFlag = hovered ? countryFlagSrc(hovered.countryCode) : null;

  return (
    <div className="coach-map-figure">
      <svg
        aria-hidden="false"
        aria-label="World map of countries with WIAL coaches and affiliates."
        className="coach-map-svg"
        role="group"
        viewBox={`0 0 ${WORLD_MAP.width} ${WORLD_MAP.height}`}
      >
        <path className="coach-map-land" d={WORLD_LAND_PATH} />
        {markers.map((marker, index) => (
          <g className="coach-map-marker" key={`${marker.label}-${index}`}>
            {/* generous invisible hit target around the visible dot */}
            <circle
              aria-label={`${marker.label}: ${markerDescription(marker)}.`}
              className="coach-map-hit"
              cx={marker.x}
              cy={marker.y}
              onBlur={() => setHoveredIndex(null)}
              onFocus={() => setHoveredIndex(index)}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              r={MARKER_RADIUS + 8}
              tabIndex={0}
            />
            {marker.affiliate ? (
              <circle
                className="coach-map-affiliate-ring"
                cx={marker.x}
                cy={marker.y}
                r={MARKER_RADIUS + 3}
              />
            ) : null}
            <circle className="coach-map-dot" cx={marker.x} cy={marker.y} r={MARKER_RADIUS} />
          </g>
        ))}
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
          {hovered.hasCoaches ? <span>WIAL-certified coaches</span> : null}
          {hovered.affiliate ? (
            <span className="coach-map-tooltip-affiliate">
              Local affiliate: {hovered.affiliate.name}
            </span>
          ) : null}
        </div>
      ) : null}

      <div aria-hidden="true" className="coach-map-legend">
        <span className="coach-map-legend-item">
          <svg height={LEGEND_BOX} viewBox={`0 0 ${LEGEND_BOX} ${LEGEND_BOX}`} width={LEGEND_BOX}>
            <circle
              className="coach-map-dot"
              cx={LEGEND_BOX / 2}
              cy={LEGEND_BOX / 2}
              r={MARKER_RADIUS}
            />
          </svg>
          Countries with WIAL coaches
        </span>
        <span className="coach-map-legend-item">
          <svg height={LEGEND_BOX} viewBox={`0 0 ${LEGEND_BOX} ${LEGEND_BOX}`} width={LEGEND_BOX}>
            <circle
              className="coach-map-affiliate-ring"
              cx={LEGEND_BOX / 2}
              cy={LEGEND_BOX / 2}
              r={MARKER_RADIUS + 3}
            />
            <circle
              className="coach-map-dot"
              cx={LEGEND_BOX / 2}
              cy={LEGEND_BOX / 2}
              r={MARKER_RADIUS}
            />
          </svg>
          WIAL affiliate
        </span>
      </div>
    </div>
  );
}
