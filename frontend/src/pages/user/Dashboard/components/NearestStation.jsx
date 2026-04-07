import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { MapPin, Navigation } from 'lucide-react';
import { Link } from 'react-router-dom';
import { stationService } from '@/services/stationService';
import { formatDistance } from '@/utils/formatters';
import AQIBadge from '@/components/common/AQIBadge/AQIBadge';
import Card from '@/components/ui/Card/Card';
import styles from './NearestStation.module.css';

export default function NearestStation({ position }) {
  const { t, i18n } = useTranslation();
  const [station, setStation] = useState(null);

  useEffect(() => {
    if (!position?.lat || !position?.lng) return;

    stationService.getNearestStation(position.lat, position.lng)
      .then((data) => setStation(data))
      .catch(() => {});
  }, [position]);

  if (!station) {
    return (
      <Card title={t('dashboard.nearestStation')} icon={MapPin} padding="md">
        <p className={styles.noData}>
          {position ? t('dashboard.noData') : '📍 Đang xác định vị trí...'}
        </p>
      </Card>
    );
  }

  return (
    <Card title={t('dashboard.nearestStation')} icon={MapPin} padding="md">
      <div className={styles.content}>
        <div className={styles.stationInfo}>
          <h4 className={styles.stationName}>{station.name}</h4>
          {station.distance_meters != null && (
            <span className={styles.distance}>
              <Navigation size={12} />
              {t('dashboard.distanceAway', { distance: formatDistance(station.distance_meters) })}
            </span>
          )}
        </div>
        {station.latest && (
          <AQIBadge value={station.latest?.aqi} size="md" lang={i18n.language} />
        )}
        <Link to={`/station/${station.id}`} className={styles.link}>
          {t('station.viewHistory')} →
        </Link>
      </div>
    </Card>
  );
}
