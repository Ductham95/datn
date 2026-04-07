import { useTranslation } from 'react-i18next';
import { useDashboard } from '@/hooks/useDashboard';
import { useTelemetryStore } from '@/stores/useTelemetryStore';
import AQIMap from '@/components/map/AQIMap/AQIMap';
import { PageLoader } from '@/components/ui/Spinner/Spinner';
import { AQI_LEVELS } from '@/utils/aqi';
import styles from './MapView.module.css';

export default function MapView() {
  const { t } = useTranslation();
  const { stations, loading } = useDashboard();
  const latestData = useTelemetryStore((s) => s.latestData);

  const mergedStations = stations.map((s) => {
    const id = s.node_id || s.id;
    const rt = latestData[id];
    const latest = {
      aqi: s.aqi,
      pm25: s.pm25,
      pm10: s.pm10,
      co2: s.co2,
      tvoc: s.tvoc,
      temperature: s.temperature,
      humidity: s.humidity,
      ...rt,
    };
    return { ...s, id, latest };
  });

  if (loading) return <PageLoader />;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>{t('map.title')}</h1>
      </div>
      <div className={styles.mapContainer}>
        <AQIMap stations={mergedStations} />
      </div>
      {/* Legend */}
      <div className={styles.legend}>
        <span className={styles.legendTitle}>{t('map.legend')}</span>
        <div className={styles.legendItems}>
          {AQI_LEVELS.map((level) => (
            <div key={level.level} className={styles.legendItem}>
              <span
                className={styles.legendDot}
                style={{ background: level.color }}
              />
              <span className={styles.legendLabel}>
                {level.min}-{level.max}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
