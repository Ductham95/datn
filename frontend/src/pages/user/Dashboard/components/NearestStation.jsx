import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { MapPin, Navigation, Check } from 'lucide-react';
import { formatDistance } from '@/utils/formatters';
import { getAQIColor } from '@/utils/aqi';
import { haversine } from '@/utils/geo';
import AQIBadge from '@/components/common/AQIBadge/AQIBadge';
import Card from '@/components/ui/Card/Card';
import styles from './NearestStation.module.css';

export default function NearestStation({ stations = [], position, selectedId, onSelect }) {
  const { t, i18n } = useTranslation();

  const sorted = useMemo(() => {
    if (!position?.lat || !position?.lng || stations.length === 0) return stations;

    return [...stations]
      .map((s) => ({
        ...s,
        distance_meters: haversine(position.lat, position.lng, Number(s.lat), Number(s.lng)),
      }))
      .sort((a, b) => a.distance_meters - b.distance_meters);
  }, [stations, position]);

  if (sorted.length === 0) {
    return (
      <Card title={t('dashboard.nearestStation')} icon={MapPin} padding="md">
        <p className={styles.noData}>
          {position ? t('dashboard.noData') : '📍 Đang xác định vị trí...'}
        </p>
      </Card>
    );
  }

  return (
    <Card title={t('dashboard.nearestStation')} icon={MapPin} padding="sm">
      <div className={styles.list}>
        {sorted.map((s) => {
          const isSelected = s.id === selectedId;
          const aqi = s.latest?.aqi;

          return (
            <button
              key={s.id}
              className={`${styles.item} ${isSelected ? styles.selected : ''}`}
              onClick={() => onSelect?.(s.id)}
            >
              <div className={styles.itemLeft}>
                <div
                  className={styles.dot}
                  style={{ background: getAQIColor(aqi) }}
                />
                <div className={styles.itemInfo}>
                  <span className={styles.stationName}>{s.name}</span>
                  {s.distance_meters != null && (
                    <span className={styles.distance}>
                      <Navigation size={10} />
                      {formatDistance(s.distance_meters)}
                    </span>
                  )}
                </div>
              </div>
              <div className={styles.itemRight}>
                {aqi != null && (
                  <AQIBadge value={aqi} size="sm" lang={i18n.language} />
                )}
                {isSelected && <Check size={14} className={styles.checkIcon} />}
              </div>
            </button>
          );
        })}
      </div>
    </Card>
  );
}
