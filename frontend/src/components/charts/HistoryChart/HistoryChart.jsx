import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import ReactECharts from 'echarts-for-react';
import { BarChart3, TrendingUp, AreaChart } from 'lucide-react';
import { useStationHistory } from '@/hooks/useStationHistory';
import { Spinner } from '@/components/ui/Spinner/Spinner';
import { getAQIColor } from '@/utils/aqi';
import styles from './HistoryChart.module.css';

const TIME_RANGES = [
  { key: '24h', type: 'hourly', limit: 24 },
  { key: '7d', type: 'daily', limit: 7 },
  { key: '30d', type: 'daily', limit: 30 },
];

const METRICS = [
  { key: 'aqi', label: 'AQI', unit: '', color: '#8B5CF6' },
  { key: 'pm25', label: 'PM2.5', unit: 'µg/m³', color: '#F97316' },
  { key: 'pm10', label: 'PM10', unit: 'µg/m³', color: '#EAB308' },
  { key: 'co2', label: 'CO₂', unit: 'ppm', color: '#22C55E' },
  { key: 'temperature', label: 'Temp', unit: '°C', color: '#EF4444' },
  { key: 'humidity', label: 'Humidity', unit: '%', color: '#3B82F6' },
];

const CHART_TYPES = [
  { key: 'bar', icon: BarChart3 },
  { key: 'line', icon: TrendingUp },
  { key: 'area', icon: AreaChart },
];

export default function HistoryChart({ stationId, height = 300 }) {
  const { t } = useTranslation();
  const [rangeIdx, setRangeIdx] = useState(0);
  const [metricIdx, setMetricIdx] = useState(0);
  const [chartType, setChartType] = useState('bar');

  const range = TIME_RANGES[rangeIdx];
  const metric = METRICS[metricIdx];

  const { history, loading } = useStationHistory(stationId, {
    type: range.type,
    limit: range.limit,
  });

  const option = useMemo(() => {
    if (!history || history.length === 0) return null;

    const isDaily = range.type === 'daily';

    const times = history.map((d) => {
      const date = new Date(d.time);
      if (isDaily) {
        return `${date.getDate()}/${date.getMonth() + 1}`;
      }
      return `${String(date.getHours()).padStart(2, '0')}:00`;
    });

    const values = history.map((d) => {
      const val = d[metric.key];
      return val != null ? Number(Number(val).toFixed(1)) : null;
    });

    const useAqiColors = metric.key === 'aqi' || metric.key === 'pm25';

    // Build series based on chartType
    const seriesBase = {
      animationDuration: 600,
      animationEasing: 'cubicOut',
    };

    let series;
    if (chartType === 'bar') {
      series = {
        ...seriesBase,
        type: 'bar',
        barWidth: '60%',
        data: values.map((val) => ({
          value: val,
          itemStyle: {
            color: useAqiColors ? getAQIColor(metric.key === 'pm25' ? Math.round(val * 2) : val) : metric.color,
            borderRadius: [4, 4, 0, 0],
          },
        })),
      };
    } else if (chartType === 'line') {
      series = {
        ...seriesBase,
        type: 'line',
        data: values,
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { width: 2.5, color: metric.color },
        itemStyle: { color: metric.color },
      };
    } else {
      // area
      series = {
        ...seriesBase,
        type: 'line',
        data: values,
        smooth: true,
        symbol: 'none',
        lineStyle: { width: 2, color: metric.color },
        itemStyle: { color: metric.color },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: metric.color + '40' },
              { offset: 1, color: metric.color + '05' },
            ],
          },
        },
      };
    }

    return {
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(255,255,255,0.96)',
        borderColor: '#E2E8F0',
        textStyle: { color: '#334155', fontSize: 12 },
        formatter: (params) => {
          const p = params[0];
          const unit = metric.unit ? ` ${metric.unit}` : '';
          return `<strong>${p.name}</strong><br/>${metric.label}: ${p.value != null ? p.value : '—'}${unit}`;
        },
      },
      grid: { left: 50, right: 15, top: 15, bottom: 30 },
      xAxis: {
        type: 'category',
        data: times,
        axisLine: { lineStyle: { color: '#E2E8F0' } },
        axisLabel: { color: '#94A3B8', fontSize: 11 },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value',
        axisLine: { show: false },
        axisLabel: { color: '#94A3B8', fontSize: 11 },
        splitLine: { lineStyle: { color: '#F1F5F9' } },
      },
      series: [series],
    };
  }, [history, metric, chartType, range.type]);

  return (
    <div className={styles.wrapper}>
      {/* Toolbar */}
      <div className={styles.toolbar}>
        {/* Time range */}
        <div className={styles.toggleGroup}>
          {TIME_RANGES.map((r, i) => (
            <button
              key={r.key}
              className={`${styles.toggleBtn} ${i === rangeIdx ? styles.active : ''}`}
              onClick={() => setRangeIdx(i)}
            >
              {t(`chart.${r.key}`)}
            </button>
          ))}
        </div>

        {/* Metric */}
        <div className={styles.toggleGroup}>
          {METRICS.map((m, i) => (
            <button
              key={m.key}
              className={`${styles.toggleBtn} ${i === metricIdx ? styles.active : ''}`}
              onClick={() => setMetricIdx(i)}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* Chart type */}
        <div className={styles.toggleGroup}>
          {CHART_TYPES.map((ct) => {
            const Icon = ct.icon;
            return (
              <button
                key={ct.key}
                className={`${styles.toggleBtn} ${styles.iconBtn} ${chartType === ct.key ? styles.active : ''}`}
                onClick={() => setChartType(ct.key)}
                title={t(`chart.${ct.key}`)}
              >
                <Icon size={15} />
              </button>
            );
          })}
        </div>
      </div>

      {/* Chart */}
      {loading && (
        <div className={styles.loading}>
          <Spinner size={24} />
        </div>
      )}

      {!loading && !option && (
        <div className={styles.loading}>
          <span className={styles.noData}>{t('dashboard.noData')}</span>
        </div>
      )}

      {!loading && option && (
        <ReactECharts
          option={option}
          style={{ height, width: '100%' }}
          opts={{ renderer: 'canvas' }}
        />
      )}
    </div>
  );
}
