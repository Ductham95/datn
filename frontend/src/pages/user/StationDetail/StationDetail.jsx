import { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Battery, Radio, MapPin, Clock } from 'lucide-react';
import { useDashboard } from '@/hooks/useDashboard';
import { useTelemetryStore } from '@/stores/useTelemetryStore';
import AQIBadge from '@/components/common/AQIBadge/AQIBadge';
import Badge from '@/components/ui/Badge/Badge';
import Card from '@/components/ui/Card/Card';
import { PageLoader } from '@/components/ui/Spinner/Spinner';
import HistoryChart from '@/components/charts/HistoryChart/HistoryChart';
import AQIMap from '@/components/map/AQIMap/AQIMap';
import HealthAdvice from '@/pages/user/Dashboard/components/HealthAdvice';
import { formatNumber, formatBattery, formatRSSI, formatRelativeTime } from '@/utils/formatters';
import styles from './StationDetail.module.css';

const METRICS = [
  { key: 'pm25', label: 'PM2.5', unit: 'µg/m³', color: '#F97316' },
  { key: 'pm10', label: 'PM10', unit: 'µg/m³', color: '#EAB308' },
  { key: 'co2', label: 'CO₂', unit: 'ppm', color: '#22C55E' },
  { key: 'tvoc', label: 'TVOC', unit: 'ppb', color: '#8B5CF6' },
  { key: 'temperature', label: 'Nhiệt độ', unit: '°C', color: '#EF4444' },
  { key: 'humidity', label: 'Độ ẩm', unit: '%', color: '#3B82F6' },
];

export default function StationDetail() {
  const { id } = useParams();
  const { t, i18n } = useTranslation();
  const { stations, loading: stationsLoading } = useDashboard();
  const latestData = useTelemetryStore((s) => s.latestData);

  const station = useMemo(() => {
    const s = stations.find((st) => st.id === id || st.node_id === id);
    if (!s) return null;
    const sid = s.node_id || s.id;
    const rt = latestData[sid];
    const latest = {
      aqi: s.aqi,
      pm25: s.pm25,
      pm10: s.pm10,
      co2: s.co2,
      tvoc: s.tvoc,
      temperature: s.temperature,
      humidity: s.humidity,
      time: s.time,
      ...rt,
    };
    return { ...s, id: sid, latest };
  }, [stations, id, latestData]);

  // Single-station array for mini-map
  const mapStations = useMemo(() => {
    if (!station) return [];
    return [{ ...station, latest: station.latest }];
  }, [station]);

  const mapCenter = useMemo(() => {
    if (!station?.lat || !station?.lng) return null;
    return { lat: Number(station.lat), lng: Number(station.lng) };
  }, [station]);

  if (stationsLoading) return <PageLoader />;

  if (!station) {
    return (
      <div className={styles.page}>
        <p>{t('common.noResults')}</p>
        <Link to="/">{t('common.back')}</Link>
      </div>
    );
  }

  const latest = station.latest;

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <Link to="/" className={styles.backLink}>
          <ArrowLeft size={18} />
          {t('common.back')}
        </Link>
        <div className={styles.headerInfo}>
          <h1 className={styles.title}>{station.name}</h1>
          <div className={styles.badges}>
            <AQIBadge value={latest?.aqi} size="md" lang={i18n.language} />
            <Badge
              variant={station.status === 'active' ? 'success' : 'default'}
              dot
              pulse={station.status === 'active'}
            >
              {t(`status.${station.status}`)}
            </Badge>
          </div>
        </div>
      </div>

      {/* Status Cards */}
      <div className={styles.statusGrid}>
        <div className={styles.statusItem}>
          <Battery size={16} />
          <span>{formatBattery(station.battery_level)}</span>
        </div>
        <div className={styles.statusItem}>
          <Radio size={16} />
          <span>{formatRSSI(station.lora_rssi)}</span>
        </div>
        <div className={styles.statusItem}>
          <MapPin size={16} />
          <span>{station.location_desc || 'N/A'}</span>
        </div>
        {latest?.time && (
          <div className={styles.statusItem}>
            <Clock size={16} />
            <span>{formatRelativeTime(latest.time, i18n.language)}</span>
          </div>
        )}
      </div>

      {/* Current Values */}
      <div className={styles.currentGrid}>
        {METRICS.map((m) => (
          <div key={m.key} className={styles.currentItem}>
            <span className={styles.currentLabel}>{m.label}</span>
            <span className={styles.currentValue} style={{ color: m.color }}>
              {latest?.[m.key] != null ? formatNumber(latest[m.key]) : '--'}
            </span>
            <span className={styles.currentUnit}>{m.unit}</span>
          </div>
        ))}
      </div>

      {/* History Chart */}
      <Card title={t('history.title')} padding="sm" className={styles.chartCard}>
        <HistoryChart stationId={station.id} height={350} />
      </Card>

      {/* Bottom Row: Health Advice + Mini Map */}
      <div className={styles.bottomGrid}>
        <HealthAdvice
          aqi={latest?.aqi}
          pm25={latest?.pm25}
          lang={i18n.language}
        />
        <Card title={t('station.location')} icon={MapPin} padding="none" className={styles.mapCard}>
          {mapCenter && (
            <div className={styles.mapContainer}>
              <AQIMap
                stations={mapStations}
                focusPosition={mapCenter}
              />
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
