import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BarChart3 } from 'lucide-react';
import { useDashboard } from '@/hooks/useDashboard';
import { useTelemetryStore } from '@/stores/useTelemetryStore';
import Card from '@/components/ui/Card/Card';
import { PageLoader } from '@/components/ui/Spinner/Spinner';
import HistoryChart from '@/components/charts/HistoryChart/HistoryChart';
import styles from './History.module.css';

export default function History() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { stations, loading } = useDashboard();
  const latestData = useTelemetryStore((s) => s.latestData);

  // Merge realtime data
  const mergedStations = useMemo(() => {
    return stations.map((station) => {
      const id = station.node_id || station.id;
      const realtime = latestData[id];
      return { ...station, id, latest: { ...station, ...realtime } };
    });
  }, [stations, latestData]);

  // Station selection from query param or local state
  const queryStationId = searchParams.get('stationId');
  const [localStationId, setLocalStationId] = useState(null);
  const selectedId = localStationId || queryStationId || mergedStations[0]?.id;

  const selectedStation = mergedStations.find((s) => s.id === selectedId) || mergedStations[0];

  const handleStationChange = (e) => {
    const id = e.target.value;
    setLocalStationId(id);
    setSearchParams({ stationId: id }, { replace: true });
  };

  if (loading) return <PageLoader />;

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>{t('history.pageTitle')}</h1>
          <p className={styles.subtitle}>{t('history.pageSubtitle')}</p>
        </div>
      </div>

      {/* Station Selector */}
      <div className={styles.selectorRow}>
        <label htmlFor="history-station-select" className={styles.selectorLabel}>
          {t('history.selectStation')}
        </label>
        <select
          id="history-station-select"
          className={styles.select}
          value={selectedStation?.id || ''}
          onChange={handleStationChange}
        >
          {mergedStations.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} ({s.id})
            </option>
          ))}
        </select>
      </div>

      {/* Chart */}
      {selectedStation ? (
        <Card title={selectedStation.name} icon={BarChart3} padding="sm" className={styles.chartCard}>
          <HistoryChart stationId={selectedStation.id} height={500} />
        </Card>
      ) : (
        <div className={styles.empty}>
          <BarChart3 size={48} strokeWidth={1} />
          <p>{t('history.noData')}</p>
        </div>
      )}
    </div>
  );
}
