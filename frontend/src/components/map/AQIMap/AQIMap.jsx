import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Link } from 'react-router-dom';
import { getAQIColor, getAQILabel } from '@/utils/aqi';
import { MAP_CONFIG } from '@/utils/constants';
import AQIBadge from '@/components/common/AQIBadge/AQIBadge';
import 'leaflet/dist/leaflet.css';
import styles from './AQIMap.module.css';

// Fly to user's location once when it becomes available
function FlyToLocation({ position }) {
  const map = useMap();
  const hasFlewRef = useRef(false);

  useEffect(() => {
    if (position && !hasFlewRef.current) {
      hasFlewRef.current = true;
      map.flyTo([position.lat, position.lng], 14, { duration: 1.2 });
    }
  }, [position, map]);

  return null;
}

// User location marker — blue pulsing dot
const userLocationIcon = L.divIcon({
  html: `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="11" fill="#3B82F6" opacity="0.25">
        <animate attributeName="r" values="8;11;8" dur="2s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.35;0.15;0.35" dur="2s" repeatCount="indefinite"/>
      </circle>
      <circle cx="12" cy="12" r="6" fill="#3B82F6" stroke="white" stroke-width="2.5"/>
    </svg>
  `,
  className: styles.markerIcon,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -12],
});

// Create colored circle marker icon
function createMarkerIcon(aqi) {
  const color = getAQIColor(aqi);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36">
      <circle cx="18" cy="18" r="14" fill="${color}" opacity="0.2"/>
      <circle cx="18" cy="18" r="10" fill="${color}" opacity="0.9"/>
      <text x="18" y="22" text-anchor="middle" fill="white" font-size="9" font-weight="bold" font-family="Inter, sans-serif">${aqi ?? '?'}</text>
    </svg>
  `;
  return L.divIcon({
    html: svg,
    className: styles.markerIcon,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18],
  });
}

export default function AQIMap({ stations = [], center, zoom, userPosition }) {
  const mapCenter = center || MAP_CONFIG.CENTER;
  const mapZoom = zoom || MAP_CONFIG.ZOOM;

  // Calculate bounds from stations if available
  const hasPositions = stations.some(s => s.latest?.lat || s.lat);

  return (
    <div className={styles.container}>
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        className={styles.map}
        scrollWheelZoom={true}
        zoomControl={true}
      >
        <TileLayer
          url={MAP_CONFIG.TILE_URL}
          attribution={MAP_CONFIG.TILE_ATTRIBUTION}
        />
        <FlyToLocation position={userPosition} />
        {userPosition && (
          <Marker position={[userPosition.lat, userPosition.lng]} icon={userLocationIcon}>
            <Popup>Vị trí của bạn</Popup>
          </Marker>
        )}
        {stations.map((station) => {
          const lat = station.lat || station.latest?.lat;
          const lng = station.lng || station.latest?.lng;
          const aqi = station.latest?.aqi;

          if (!lat || !lng) return null;

          return (
            <Marker
              key={station.id}
              position={[lat, lng]}
              icon={createMarkerIcon(aqi)}
            >
              <Popup>
                <div className={styles.popup}>
                  <h4 className={styles.popupTitle}>{station.name}</h4>
                  <AQIBadge value={aqi} size="sm" />
                  <div className={styles.popupDetails}>
                    <span>PM2.5: {station.latest?.pm25 ?? '--'} µg/m³</span>
                    <span>CO₂: {station.latest?.co2 ?? '--'} ppm</span>
                  </div>
                  <Link to={`/station/${station.id}`} className={styles.popupLink}>
                    Chi tiết →
                  </Link>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
