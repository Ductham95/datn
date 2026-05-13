import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Wind, Droplets, Thermometer, CloudSun, Gauge, Leaf } from 'lucide-react';
import { useDashboard } from '@/hooks/useDashboard';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useWeather } from '@/hooks/useWeather';
import { useTelemetryStore } from '@/stores/useTelemetryStore';
import { getAQIColor, getAQIBgColor, getAQILevel, getWHOComparison } from '@/utils/aqi';
import { formatNumber } from '@/utils/formatters';
import MetricCard from '@/components/common/MetricCard/MetricCard';
import AQIBadge from '@/components/common/AQIBadge/AQIBadge';
import Card from '@/components/ui/Card/Card';
import { CardSkeleton } from '@/components/ui/Spinner/Spinner';
import AQIMap from '@/components/map/AQIMap/AQIMap';
import HistoryChart from '@/components/charts/HistoryChart/HistoryChart';
import HealthAdvice from './components/HealthAdvice';
import WeatherWidget from './components/WeatherWidget';
import NearestStation from './components/NearestStation';
import styles from './Dashboard.module.css';

export default function Dashboard() {
  const { t, i18n } = useTranslation();
  const { stations, loading, error } = useDashboard();
  const { position } = useGeolocation();
  // Fallback: use station GPS if browser geolocation is blocked
  const weatherLat = position?.lat || stations[0]?.lat;
  const weatherLng = position?.lng || stations[0]?.lng;
  const { weather } = useWeather(weatherLat, weatherLng);
  const latestData = useTelemetryStore((s) => s.latestData);

  // Normalize + Merge API data with realtime socket data
  // Backend returns flat: { node_id, name, pm25, pm10, aqi, ... }
  const mergedStations = useMemo(() => {
    return stations.map((station) => {
      const id = station.node_id || station.id;
      const realtime = latestData[id];
      // Build a "latest" object from flat station fields
      const latest = {
        aqi: station.aqi,
        pm25: station.pm25,
        pm10: station.pm10,
        co2: station.co2,
        tvoc: station.tvoc,
        temperature: station.temperature,
        humidity: station.humidity,
        ...realtime,
      };
      return {
        ...station,
        id,
        latest,
      };
    });
  }, [stations, latestData]);

  // Pick the first station (or nearest) for main display
  const primaryStation = mergedStations[0];
  const latest = primaryStation?.latest;

  if (loading) {
    return (
      <div className={styles.page}>
        <h1 className={styles.pageTitle}>{t('dashboard.title')}</h1>
        <div className={styles.metricsGrid}>
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.page}>
        <div className={styles.errorBox}>
          <p>{t('common.error')}: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>{t('dashboard.title')}</h1>
          {primaryStation && (
            <p className={styles.pageSubtitle}>
              📍 {primaryStation.name}
              {latest?.aqi != null && (
                <AQIBadge value={latest.aqi} size="sm" lang={i18n.language} />
              )}
            </p>
          )}
        </div>
        <div className={styles.liveIndicator}>
          <span className={styles.liveDot} />
          {t('dashboard.realtime')}
        </div>
      </div>

      {/* Metric Cards */}
      <div className={styles.metricsGrid}>
        <MetricCard
          label={t('metrics.aqi')}
          value={latest?.aqi}
          icon={Gauge}
          color={getAQIColor(latest?.aqi)}
          bgColor={getAQIBgColor(latest?.aqi)}
        />
        <MetricCard
          label={t('metrics.pm25')}
          value={latest?.pm25 != null ? formatNumber(latest.pm25) : null}
          unit="µg/m³"
          icon={Wind}
          color="#F97316"
          bgColor="#FFF7ED"
        />
        <MetricCard
          label={t('metrics.pm10')}
          value={latest?.pm10 != null ? formatNumber(latest.pm10) : null}
          unit="µg/m³"
          icon={Wind}
          color="#EAB308"
          bgColor="#FEFCE8"
        />
        <MetricCard
          label={t('metrics.co2')}
          value={latest?.co2}
          unit="ppm"
          icon={Leaf}
          color="#22C55E"
          bgColor="#F0FDF4"
        />
        <MetricCard
          label={t('metrics.temperature')}
          value={latest?.temperature != null ? formatNumber(latest.temperature) : null}
          unit="°C"
          icon={Thermometer}
          color="#EF4444"
          bgColor="#FEF2F2"
        />
        <MetricCard
          label={t('metrics.humidity')}
          value={latest?.humidity != null ? formatNumber(latest.humidity) : null}
          unit="%"
          icon={Droplets}
          color="#3B82F6"
          bgColor="#EFF6FF"
        />
      </div>

      {/* Map + Chart Row */}
      <div className={styles.gridRow}>
        <Card title={t('dashboard.mapTitle')} icon={null} className={styles.mapCard} padding="none">
          <AQIMap stations={mergedStations} userPosition={position} />
        </Card>
        <Card title={t('dashboard.historyTitle')} className={styles.chartCard} padding="sm">
          {primaryStation && (
            <HistoryChart stationId={primaryStation.id} />
          )}
          {!primaryStation && (
            <p className={styles.noData}>{t('dashboard.noData')}</p>
          )}
        </Card>
      </div>

      {/* Bottom Row: Health + Weather + Nearest */}
      <div className={styles.bottomGrid}>
        <HealthAdvice
          aqi={latest?.aqi}
          pm25={latest?.pm25}
          lang={i18n.language}
        />
        <WeatherWidget
          weather={weather}
          sensorTemp={latest?.temperature}
          sensorHumidity={latest?.humidity}
        />
        <NearestStation position={position} />
      </div>
    </div>
  );
}
