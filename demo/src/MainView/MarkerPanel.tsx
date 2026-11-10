import type { Vector } from "@jamstec-spdx/react-earth";

import type { ExtendedMarker, Unit } from "./types";
import { getUnit } from "./utils/fieldTypes";
import { magnitude } from "./utils/maths";

/** Returns a human readable string for the provided coordinates. */
function formatCoordinates(λ: number, φ: number) {
  return (
    Math.abs(φ).toFixed(2) +
    "° " +
    (φ >= 0 ? "N" : "S") +
    ", " +
    Math.abs(λ).toFixed(2) +
    "° " +
    (λ >= 0 ? "E" : "W")
  );
}

/** Returns a human readable string for the provided scalar in the given units. */
function formatScalar(value: number, unit: Unit) {
  return unit.conversion(value).toFixed(unit.precision);
}

/**
 * Returns a human readable string for the provided rectangular wind vector in the given units.
 * See http://mst.nerc.ac.uk/wind_vect_convs.html.
 */
function formatVector(vector: Vector | null, unit: Unit) {
  if (!vector) return "";
  const d = (Math.atan2(-vector[0], -vector[1]) * 360) / (2 * Math.PI); // calculate into-the-wind cardinal degrees
  const wd = Math.round(((d + 360) % 360) / 5) * 5; // shift [-180, 180] to [0, 360], and round to nearest 5.
  return wd.toFixed(0) + "° @ " + formatScalar(magnitude(vector), unit);
}

type MarkerPanelProps = {
  marker?: ExtendedMarker;
  removeMarker: () => void;
};

const MarkerPanel = ({ marker, removeMarker }: MarkerPanelProps) => {
  if (!marker) {
    return;
  }

  const unit = getUnit(marker.type);

  return (
    <div className="marker-panel">
      <div>
        <span>{formatCoordinates(marker.lon, marker.lat)}</span>
        <button className="marker-close" onClick={removeMarker}>
          ✕
        </button>
      </div>
      <span>
        {marker.isScalar
          ? formatScalar(marker.value, unit)
          : formatVector(marker.value, unit)}{" "}
        {unit.label}
      </span>
    </div>
  );
};

export default MarkerPanel;
