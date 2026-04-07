import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Battery, Radio, MapPin } from 'lucide-react';
import { useDashboard } from '@/hooks/useDashboard';
import { useStationHistory } from '@/hooks/useStationHistory';
import { useTelemetryStore } from '@/stores/useTelemetryStore';
import ReactECharts from 'echarts-for-react';
import AQIBadge from '@/components/common/AQIBadge/AQIBadge';
import Badge from '@/components/ui/Badge/Badge';
import Button from '@/components/ui/Button/Button';
import Card from '@/components/ui/Card/Card';
import { PageLoader } from '@/components/ui/Spinner/Spinner';
import { formatNumber, formatDateTime, formatBattery, formatRSSI } from '@/utils/formatters';
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
  const [selectedMetric, setSelectedMetric] = useState('pm25');
  const [mode, setMode] = useState('hourly');

  const { history, loading: historyLoading } = useStationHistory(id, { mode });

  const station = useMemo(() => {
    const s = stations.find((st) => st.id === id);
    if (!s) return null;
    const rt = latestData[id];
    return rt ? { ...s, latest: { ...s.latest, ...rt } } : s;
  }, [stations, id, latestData]);

  const chartOption = useMemo(() => {
    if (!history || history.length === 0) return null;
    const metricInfo = METRICS.find((m) => m.key === selectedMetric);
    const metricKey = mode === 'hourly' ? `avg_${selectedMetric}` : selectedMetric;

    const times = history.map((d) => {
      const date = new Date(d.bucket_time || d.time);
      return `${String(date.getHours()).padStart(2, '0')}:00`;
    });
    const values = history.map((d) => {
      const v = d[metricKey] ?? d[selectedMetric];
      return v != null ? Number(Number(v).toFixed(1)) : null;
    });

    return {
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderColor: '#E2E8F0',
        textStyle: { color: '#334155', fontSize: 12 },
      },
      grid: { left: 50, right: 20, top: 20, bottom: 35 },
      xAxis: {
        type: 'category',
        data: times,
        axisLine: { lineStyle: { color: '#E2E8F0' } },
        axisLabel: { color: '#94A3B8', fontSize: 11 },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value',
        name: metricInfo?.unit,
        nameTextStyle: { color: '#94A3B8', fontSize: 11 },
        axisLine: { show: false },
        axisLabel: { color: '#94A3B8', fontSize: 11 },
        splitLine: { lineStyle: { color: '#F1F5F9' } },
      },
      series: [{
        type: 'bar',
        data: values,
        itemStyle: { color: metricInfo?.color, borderRadius: [4, 4, 0, 0] },
        barWidth: '60%',
        animationDuration: 600,
      }],
    };
  }, [history, selectedMetric, mode]);

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
      <Card title={t('history.title')} padding="md" className={styles.chartCard}>
        <div className={styles.chartControls}>
          <div className={styles.metricButtons}>
            {METRICS.map((m) => (
              <button
                key={m.key}
                className={`${styles.metricBtn} ${selectedMetric === m.key ? styles.metricBtnActive : ''}`}
                onClick={() => setSelectedMetric(m.key)}
                style={selectedMetric === m.key ? { background: m.color, color: '#fff' } : {}}
              >
                {m.label}
              </button>
            ))}
          </div>
          <div className={styles.modeToggle}>
            <button
              className={`${styles.modeBtn} ${mode === 'hourly' ? styles.modeBtnActive : ''}`}
              onClick={() => setMode('hourly')}
            >
              {t('history.hourly')}
            </button>
            <button
              className={`${styles.modeBtn} ${mode === 'raw' ? styles.modeBtnActive : ''}`}
              onClick={() => setMode('raw')}
            >
              {t('history.raw')}
            </button>
          </div>
        </div>
        {historyLoading ? (
          <div className={styles.chartLoading}>Loading...</div>
        ) : chartOption ? (
          <ReactECharts option={chartOption} style={{ height: 350 }} />
        ) : (
          <div className={styles.chartLoading}>{t('history.noData')}</div>
        )}
      </Card>
    </div>
  );
}
