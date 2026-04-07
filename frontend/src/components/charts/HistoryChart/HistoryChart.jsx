import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { useStationHistory } from '@/hooks/useStationHistory';
import { Spinner } from '@/components/ui/Spinner/Spinner';
import { getAQIColor } from '@/utils/aqi';
import styles from './HistoryChart.module.css';

export default function HistoryChart({ stationId, metric = 'pm25', height = 300 }) {
  const { history, loading } = useStationHistory(stationId, { mode: 'hourly' });

  const option = useMemo(() => {
    if (!history || history.length === 0) return null;

    const times = history.map((d) => {
      const date = new Date(d.bucket_time || d.time);
      return `${date.getHours()}:00`;
    });

    const metricKey = metric === 'aqi' ? 'avg_pm25' : `avg_${metric}`;
    const values = history.map((d) => {
      const val = d[metricKey] ?? d[metric] ?? d.avg_pm25;
      return val != null ? Number(val.toFixed(1)) : null;
    });

    const colors = values.map((v) => {
      if (metric === 'pm25' || metric === 'aqi') {
        // Approximate AQI from PM2.5 for coloring
        return getAQIColor(v != null ? Math.round(v * 2) : 0);
      }
      return 'var(--color-primary-500)';
    });

    return {
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderColor: '#E2E8F0',
        textStyle: { color: '#334155', fontSize: 12 },
      },
      grid: {
        left: 45,
        right: 15,
        top: 15,
        bottom: 30,
      },
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
      series: [
        {
          type: 'bar',
          data: values.map((val, i) => ({
            value: val,
            itemStyle: { color: colors[i], borderRadius: [4, 4, 0, 0] },
          })),
          barWidth: '60%',
          animationDuration: 800,
          animationEasing: 'cubicOut',
        },
      ],
    };
  }, [history, metric]);

  if (loading) {
    return (
      <div className={styles.loading}>
        <Spinner size={24} />
      </div>
    );
  }

  if (!option) {
    return (
      <div className={styles.loading}>
        <span className={styles.noData}>Chưa có dữ liệu</span>
      </div>
    );
  }

  return (
    <ReactECharts
      option={option}
      style={{ height, width: '100%' }}
      opts={{ renderer: 'canvas' }}
    />
  );
}
