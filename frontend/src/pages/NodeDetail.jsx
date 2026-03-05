import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactECharts from 'echarts-for-react';

// Demo data for nodes
const DEMO_NODES = {
  1: {
    id: 1, name: 'Node 01 - Trung tâm', location_name: 'Quận 1, TP.HCM',
    latitude: 10.7769, longitude: 106.7009, status: 'online',
    pm25: 28.5, pm10: 45.2, co2: 620, tvoc: 85,
    temperature: 32.1, humidity: 72.5, battery: 85, aqi: 82, rssi: -67, snr: 9.5,
    aqi_info: { label: 'Trung bình', color: '#eab308' },
    co2_info: { label: 'Tốt', color: '#22c55e' },
    tvoc_info: { label: 'Trung bình', color: '#eab308' },
  },
  2: {
    id: 2, name: 'Node 02 - Công nghiệp', location_name: 'Quận Tân Phú, TP.HCM',
    latitude: 10.8231, longitude: 106.6297, status: 'online',
    pm25: 68.3, pm10: 95.1, co2: 1250, tvoc: 420,
    temperature: 33.8, humidity: 65.3, battery: 62, aqi: 156, rssi: -82, snr: 6.2,
    aqi_info: { label: 'Không tốt', color: '#ef4444' },
    co2_info: { label: 'Kém', color: '#f97316' },
    tvoc_info: { label: 'Kém', color: '#f97316' },
  },
  3: {
    id: 3, name: 'Node 03 - Ngoại ô', location_name: 'TP. Thủ Đức, TP.HCM',
    latitude: 10.8506, longitude: 106.7718, status: 'online',
    pm25: 8.2, pm10: 15.7, co2: 430, tvoc: 32,
    temperature: 31.5, humidity: 78.2, battery: 93, aqi: 34, rssi: -55, snr: 11.3,
    aqi_info: { label: 'Tốt', color: '#22c55e' },
    co2_info: { label: 'Tốt', color: '#22c55e' },
    tvoc_info: { label: 'Tốt', color: '#22c55e' },
  },
};

function generateHistory(baseVal, variance, count = 288) {
  const data = [];
  const now = Date.now();
  for (let i = count; i >= 0; i--) {
    const t = new Date(now - i * 5 * 60 * 1000);
    data.push({
      time: t.toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }),
      value: Math.max(0, baseVal + (Math.random() - 0.5) * variance + Math.sin(i / 25) * variance * 0.4),
    });
  }
  return data;
}

function getAQIColor(aqi) {
  if (aqi <= 50) return '#22c55e';
  if (aqi <= 100) return '#eab308';
  if (aqi <= 150) return '#f97316';
  if (aqi <= 200) return '#ef4444';
  if (aqi <= 300) return '#a855f7';
  return '#991b1b';
}

export default function NodeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState('24h');
  const node = DEMO_NODES[id];

  if (!node) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">❌</div>
        <h3>Node không tồn tại</h3>
        <p>Không tìm thấy node với ID: {id}</p>
      </div>
    );
  }

  const pm25History = generateHistory(node.pm25, 30);
  const pm10History = generateHistory(node.pm10, 40);
  const co2History = generateHistory(node.co2, 400);
  const tvocHistory = generateHistory(node.tvoc, 200);
  const tempHistory = generateHistory(node.temperature, 5);
  const humHistory = generateHistory(node.humidity, 15);

  const makeLineChart = (title, data1, data2, name1, name2, unit, color1, color2) => ({
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#1a1d2e',
      borderColor: 'rgba(148,163,184,0.1)',
      textStyle: { color: '#f1f5f9', fontSize: 12 },
    },
    legend: {
      data: [name1, name2].filter(Boolean),
      textStyle: { color: '#94a3b8', fontSize: 11 },
      top: 0,
    },
    grid: { top: 30, right: 15, bottom: 25, left: 50 },
    xAxis: {
      type: 'category',
      data: data1.map(d => d.time),
      axisLine: { lineStyle: { color: 'rgba(148,163,184,0.15)' } },
      axisLabel: { color: '#64748b', fontSize: 10, interval: 50 },
    },
    yAxis: {
      type: 'value',
      name: unit,
      nameTextStyle: { color: '#64748b', fontSize: 11 },
      axisLine: { show: false },
      splitLine: { lineStyle: { color: 'rgba(148,163,184,0.06)' } },
      axisLabel: { color: '#64748b', fontSize: 10 },
    },
    series: [
      {
        name: name1, type: 'line', smooth: true, symbol: 'none',
        data: data1.map(d => d.value.toFixed(1)),
        lineStyle: { color: color1, width: 2 },
        areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: color1 + '33' }, { offset: 1, color: color1 + '00' }] } },
      },
      ...(data2 ? [{
        name: name2, type: 'line', smooth: true, symbol: 'none',
        data: data2.map(d => d.value.toFixed(1)),
        lineStyle: { color: color2, width: 2 },
        areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: color2 + '33' }, { offset: 1, color: color2 + '00' }] } },
      }] : []),
    ],
  });

  const aqiGaugeOption = {
    backgroundColor: 'transparent',
    series: [{
      type: 'gauge', startAngle: 220, endAngle: -40, radius: '95%',
      min: 0, max: 500,
      progress: { show: true, width: 18, roundCap: true },
      pointer: { show: false },
      axisLine: { lineStyle: { width: 18, color: [[0.1, '#22c55e'], [0.2, '#eab308'], [0.3, '#f97316'], [0.4, '#ef4444'], [0.6, '#a855f7'], [1, '#991b1b']] } },
      axisTick: { show: false },
      splitLine: { show: false },
      axisLabel: { show: false },
      detail: {
        valueAnimation: true, fontSize: 48, fontWeight: 800,
        color: getAQIColor(node.aqi), offsetCenter: [0, '5%'],
      },
      title: { fontSize: 14, color: '#94a3b8', offsetCenter: [0, '60%'] },
      data: [{ value: node.aqi, name: node.aqi_info.label }],
    }],
  };

  return (
    <div>
      {/* Top Bar */}
      <div className="top-bar">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
            <button onClick={() => navigate('/')} style={{
              background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
              color: 'var(--text-secondary)', padding: '6px 12px', cursor: 'pointer', fontSize: 13,
            }}>← Quay lại</button>
            <h2>{node.name}</h2>
            <span className={`node-status ${node.status}`}>{node.status}</span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>📍 {node.location_name}</p>
        </div>
        <div className="top-bar-actions">
          {['24h', '7d', '30d'].map(range => (
            <button key={range} onClick={() => setTimeRange(range)} style={{
              padding: '6px 14px', borderRadius: 'var(--radius-sm)', fontSize: 13, cursor: 'pointer',
              border: '1px solid var(--border)',
              background: timeRange === range ? 'var(--primary)' : 'var(--bg-card)',
              color: timeRange === range ? 'white' : 'var(--text-secondary)',
            }}>{range}</button>
          ))}
        </div>
      </div>

      {/* Metrics Overview */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(6, 1fr)' }}>
        {[
          { label: 'PM2.5', value: node.pm25, unit: 'µg/m³', color: '#f97316' },
          { label: 'PM10', value: node.pm10, unit: 'µg/m³', color: '#3b82f6' },
          { label: 'CO₂', value: node.co2, unit: 'ppm', color: node.co2_info.color },
          { label: 'TVOC', value: node.tvoc, unit: 'ppb', color: node.tvoc_info.color },
          { label: 'Nhiệt độ', value: node.temperature, unit: '°C', color: '#f59e0b' },
          { label: 'Độ ẩm', value: node.humidity, unit: '%', color: '#06b6d4' },
        ].map(m => (
          <div className="stat-card" key={m.label}>
            <div className="stat-card-label">{m.label}</div>
            <div className="stat-card-value" style={{ color: m.color, fontSize: 24 }}>
              {m.value}<span className="stat-card-unit">{m.unit}</span>
            </div>
          </div>
        ))}
      </div>

      {/* AQI Gauge + Info */}
      <div className="grid-2" style={{ gridTemplateColumns: '1fr 2fr' }}>
        <div className="card">
          <div className="card-header"><span className="card-title">🌡️ Chỉ số AQI</span></div>
          <div className="card-body" style={{ textAlign: 'center' }}>
            <ReactECharts option={aqiGaugeOption} style={{ height: 220 }} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginTop: 10 }}>
              <div style={{ background: 'var(--bg-elevated)', padding: '8px 10px', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Pin</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: node.battery < 20 ? '#ef4444' : '#3b82f6' }}>
                  {node.battery}%
                </div>
              </div>
              <div style={{ background: 'var(--bg-elevated)', padding: '8px 10px', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>RSSI</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#a855f7' }}>{node.rssi} dBm</div>
              </div>
              <div style={{ background: 'var(--bg-elevated)', padding: '8px 10px', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>SNR</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#06b6d4' }}>{node.snr} dB</div>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">💨 Bụi mịn PM2.5 / PM10</span></div>
          <div className="card-body">
            <ReactECharts option={makeLineChart('', pm25History, pm10History, 'PM2.5', 'PM10', 'µg/m³', '#f97316', '#3b82f6')} style={{ height: 280 }} />
          </div>
        </div>
      </div>

      {/* CO2 + TVOC Charts */}
      <div className="grid-2">
        <div className="card">
          <div className="card-header"><span className="card-title">🏭 CO₂</span></div>
          <div className="card-body">
            <ReactECharts option={makeLineChart('', co2History, null, 'CO₂', null, 'ppm', '#10b981', '')} style={{ height: 260 }} />
          </div>
        </div>
        <div className="card">
          <div className="card-header"><span className="card-title">🧪 TVOC</span></div>
          <div className="card-body">
            <ReactECharts option={makeLineChart('', tvocHistory, null, 'TVOC', null, 'ppb', '#a855f7', '')} style={{ height: 260 }} />
          </div>
        </div>
      </div>

      {/* Temperature + Humidity */}
      <div className="grid-2">
        <div className="card">
          <div className="card-header"><span className="card-title">🌡️ Nhiệt độ</span></div>
          <div className="card-body">
            <ReactECharts option={makeLineChart('', tempHistory, null, 'Nhiệt độ', null, '°C', '#f59e0b', '')} style={{ height: 260 }} />
          </div>
        </div>
        <div className="card">
          <div className="card-header"><span className="card-title">💧 Độ ẩm</span></div>
          <div className="card-body">
            <ReactECharts option={makeLineChart('', humHistory, null, 'Độ ẩm', null, '%', '#06b6d4', '')} style={{ height: 260 }} />
          </div>
        </div>
      </div>
    </div>
  );
}
