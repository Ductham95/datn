import { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import ReactECharts from 'echarts-for-react';
import { useStationHistory } from '@/hooks/useStationHistory';
import { Spinner } from '@/components/ui/Spinner/Spinner';
import styles from './HistoryChart.module.css';

const TIME_RANGES = [
  { key: '24h', type: 'hourly', limit: 24 },
  { key: '7d', type: 'daily', limit: 7 },
  { key: '30d', type: 'daily', limit: 30 },
];

const METRICS = [
  { key: 'aqi', label: 'AQI', unit: '', color: '#8B5CF6', yAxisIndex: 0 },
  { key: 'pm25', label: 'PM2.5', unit: 'µg/m³', color: '#F97316', yAxisIndex: 0 },
  { key: 'pm10', label: 'PM10', unit: 'µg/m³', color: '#EAB308', yAxisIndex: 0 },
  { key: 'co2', label: 'CO₂', unit: 'ppm', color: '#22C55E', yAxisIndex: 0 },
  { key: 'temperature', label: 'Temp', unit: '°C', color: '#EF4444', yAxisIndex: 1 },
  { key: 'humidity', label: 'Humidity', unit: '%', color: '#3B82F6', yAxisIndex: 1 },
];

const RIGHT_AXIS_KEYS = new Set(['temperature', 'humidity']);

export default function HistoryChart({ stationId, height = 300 }) {
  const { t } = useTranslation();
  const [rangeIdx, setRangeIdx] = useState(0);
  const [selectedMetrics, setSelectedMetrics] = useState(() => new Set(['aqi', 'pm25']));

  const range = TIME_RANGES[rangeIdx];

  const { history, loading } = useStationHistory(stationId, {
    type: range.type,
    limit: range.limit,
  });

  const toggleMetric = useCallback((key) => {
    setSelectedMetrics((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        if (next.size <= 1) return prev; // keep at least 1
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  const needsRightAxis = useMemo(
    () => [...selectedMetrics].some((k) => RIGHT_AXIS_KEYS.has(k)),
    [selectedMetrics],
  );

  const option = useMemo(() => {
    if (!history || history.length === 0) return null;

    const isDaily = range.type === 'daily';

    const times = history.map((d) => {
      const date = new Date(d.time);
      if (isDaily) return `${date.getDate()}/${date.getMonth() + 1}`;
      return `${String(date.getHours()).padStart(2, '0')}:00`;
    });

    const activeMetrics = METRICS.filter((m) => selectedMetrics.has(m.key));

    const series = activeMetrics.map((m) => ({
      name: m.label,
      type: 'line',
      smooth: true,
      symbol: 'none',
      yAxisIndex: needsRightAxis ? m.yAxisIndex : 0,
      lineStyle: { width: 2, color: m.color },
      itemStyle: { color: m.color },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: m.color + '30' },
            { offset: 1, color: m.color + '05' },
          ],
        },
      },
      emphasis: { focus: 'series' },
      data: history.map((d) => {
        const val = d[m.key];
        return val != null ? Number(Number(val).toFixed(1)) : null;
      }),
      animationDuration: 600,
      animationEasing: 'cubicOut',
    }));

    const yAxes = [
      {
        type: 'value',
        axisLine: { show: false },
        axisLabel: { color: '#94A3B8', fontSize: 11 },
        splitLine: { lineStyle: { color: '#F1F5F9' } },
      },
    ];

    if (needsRightAxis) {
      yAxes.push({
        type: 'value',
        position: 'right',
        axisLine: { show: false },
        axisLabel: { color: '#94A3B8', fontSize: 11 },
        splitLine: { show: false },
      });
    }

    return {
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(255,255,255,0.96)',
        borderColor: '#E2E8F0',
        textStyle: { color: '#334155', fontSize: 12 },
        formatter: (params) => {
          let html = `<strong>${params[0]?.axisValue}</strong>`;
          params.forEach((p) => {
            const m = activeMetrics.find((am) => am.label === p.seriesName);
            const unit = m?.unit ? ` ${m.unit}` : '';
            html += `<br/><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${p.color};margin-right:6px"></span>${p.seriesName}: ${p.value != null ? p.value : '—'}${unit}`;
          });
          return html;
        },
      },
      grid: { left: 50, right: needsRightAxis ? 50 : 15, top: 15, bottom: 30 },
      xAxis: {
        type: 'category',
        data: times,
        axisLine: { lineStyle: { color: '#E2E8F0' } },
        axisLabel: { color: '#94A3B8', fontSize: 11 },
        axisTick: { show: false },
      },
      yAxis: yAxes,
      series,
    };
  }, [history, selectedMetrics, needsRightAxis, range.type]);

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

        {/* Metric chips */}
        <div className={styles.chipGroup}>
          {METRICS.map((m) => {
            const isActive = selectedMetrics.has(m.key);
            return (
              <button
                key={m.key}
                className={`${styles.chip} ${isActive ? styles.chipActive : ''}`}
                style={isActive ? { borderColor: m.color, '--chip-color': m.color } : undefined}
                onClick={() => toggleMetric(m.key)}
              >
                <span
                  className={styles.chipDot}
                  style={{ background: isActive ? m.color : '#CBD5E1' }}
                />
                {m.label}
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
          notMerge
        />
      )}
    </div>
  );
}
