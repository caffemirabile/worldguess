import L from "leaflet";
import { MapContainer, Marker, TileLayer, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";

// Coral map-pin marker matching the design's primary token.
const pinIcon = L.divIcon({
  className: "worldguess-pin",
  html: `<svg width="36" height="44" viewBox="0 0 36 44" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M18 0C8.06 0 0 8.06 0 18c0 13.5 18 26 18 26s18-12.5 18-26C36 8.06 27.94 0 18 0z" fill="oklch(0.66 0.2 25)"/>
    <circle cx="18" cy="18" r="7" fill="oklch(0.13 0.02 258)"/>
  </svg>`,
  iconSize: [36, 44],
  iconAnchor: [18, 44],
  popupAnchor: [0, -40],
});

interface MapViewProps {
  latitude: number;
  longitude: number;
  zoom?: number;
  markerLabel?: string;
  className?: string;
}

/**
 * Static, non-interactive map display of a place's location using
 * OpenStreetMap tiles. Interaction is disabled so the map is a read-only
 * reveal surface, not a guessing mechanism.
 */
export function MapView({
  latitude,
  longitude,
  zoom = 12,
  markerLabel,
  className,
}: MapViewProps) {
  return (
    <MapContainer
      center={[latitude, longitude]}
      zoom={zoom}
      className={className}
      dragging={false}
      scrollWheelZoom={false}
      touchZoom={false}
      doubleClickZoom={false}
      boxZoom={false}
      keyboard={false}
      zoomControl={false}
      attributionControl={true}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={[latitude, longitude]} icon={pinIcon}>
        {markerLabel ? (
          <Tooltip direction="top" offset={[0, -40]} opacity={1}>
            {markerLabel}
          </Tooltip>
        ) : null}
      </Marker>
    </MapContainer>
  );
}
