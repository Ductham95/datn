import { useState, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// Simulated data for demo (replace with API calls in production)
const DEMO_NODES = [
  {
    id: 1, name: 'Node 01 - Trung tâm', location_name: 'Quận 1, TP.HCM',
    latitude: 10.7769, longitude: 106.7009, status: 'online',
    latest_pm25: 28.5, latest_pm10: 45.2, latest_co2: 620, latest_tvoc: 85,
    latest_temp: 32.1, latest_humidity: 72.5, latest_battery: 85, latest_aqi: 82,
    aqi_info: { level: 'moderate', label: 'Trung bình', color: '#eab308', emoji: '🟡' },
  },
  {
    id: 2, name: 'Node 02 - Công nghiệp', location_name: 'Quận Tân Phú, TP.HCM',
    latitude: 10.8231, longitude: 106.6297, status: 'online',
    latest_pm25: 68.3, latest_pm10: 95.1, latest_co2: 1250, latest_tvoc: 420,
    latest_temp: 33.8, latest_humidity: 65.3, latest_battery: 62, latest_aqi: 156,
    aqi_info: { level: 'unhealthy', label: 'Không tốt', color: '#ef4444', emoji: '🔴' },
  },
  {
    id: 3, name: 'Node 03 - Ngoại ô', location_name: 'TP. Thủ Đức, TP.HCM',
    latitude: 10.8506, longitude: 106.7718, status: 'online',
    latest_pm25: 8.2, latest_pm10: 15.7, latest_co2: 430, latest_tvoc: 32,
    latest_temp: 31.5, latest_humidity: 78.2, latest_battery: 93, latest_aqi: 34,
    aqi_info: { level: 'good', label: 'Tốt', color: '#22c55e', emoji: '🟢' },
  },
];

// Generate demo historical data
function generateHistoricalData(hours = 24) {
  const data = [];
  const now = Date.now();
  for (let i = hours * 12; i >= 0; i--) {
    const time = new Date(now - i * 5 * 60 * 1000);
    data.push({
      time: time.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      pm25: 15 + Math.random() * 50 + Math.sin(i / 20) * 15,
      pm10: 25 + Math.random() * 60 + Math.sin(i / 20) * 20,
      co2: 400 + Math.random() * 600 + Math.sin(i / 15) * 200,
      tvoc: 30 + Math.random() * 300 + Math.sin(i / 18) * 80,
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

export default function Dashboard() {
  const [nodes] = useState(DEMO_NODES);
  const [historicalData] = useState(generateHistoricalData());
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Avg AQI
  const avgAQI = Math.round(nodes.reduce((sum, n) => sum + n.latest_aqi, 0) / nodes.length);

  // PM2.5 & PM10 Line Chart options
  const pmChartOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#1a1d2e',
      borderColor: 'rgba(148, 163, 184, 0.1)',
      textStyle: { color: '#f1f5f9', fontSize: 12 },
    },
    legend: {
      data: ['PM2.5', 'PM10'],
      textStyle: { color: '#94a3b8', fontSize: 12 },
      top: 0,
    },
    grid: { top: 35, right: 20, bottom: 25, left: 50 },
    xAxis: {
      type: 'category',
      data: historicalData.map(d => d.time),
      axisLine: { lineStyle: { color: 'rgba(148,163,184,0.15)' } },
      axisLabel: { color: '#64748b', fontSize: 10, interval: 35 },
    },
    yAxis: {
      type: 'value',
      name: 'µg/m³',
      nameTextStyle: { color: '#64748b', fontSize: 11 },
      axisLine: { show: false },
      splitLine: { lineStyle: { color: 'rgba(148,163,184,0.06)' } },
      axisLabel: { color: '#64748b', fontSize: 10 },
    },
    series: [
      {
        name: 'PM2.5',
        type: 'line',
        data: historicalData.map(d => d.pm25.toFixed(1)),
        smooth: true,
        symbol: 'none',
        lineStyle: { color: '#f97316', width: 2 },
        areaStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(249,115,22,0.25)' },
              { offset: 1, color: 'rgba(249,115,22,0)' },
            ],
          },
        },
      },
      {
        name: 'PM10',
        type: 'line',
        data: historicalData.map(d => d.pm10.toFixed(1)),
        smooth: true,
        symbol: 'none',
        lineStyle: { color: '#3b82f6', width: 2 },
        areaStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(59,130,246,0.2)' },
              { offset: 1, color: 'rgba(59,130,246,0)' },
            ],
          },
        },
      },
    ],
  };

  // CO2 & TVOC Chart
  const gasChartOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#1a1d2e',
      borderColor: 'rgba(148, 163, 184, 0.1)',
      textStyle: { color: '#f1f5f9', fontSize: 12 },
    },
    legend: {
      data: ['CO₂ (ppm)', 'TVOC (ppb)'],
      textStyle: { color: '#94a3b8', fontSize: 12 },
      top: 0,
    },
    grid: { top: 35, right: 60, bottom: 25, left: 50 },
    xAxis: {
      type: 'category',
      data: historicalData.map(d => d.time),
      axisLine: { lineStyle: { color: 'rgba(148,163,184,0.15)' } },
      axisLabel: { color: '#64748b', fontSize: 10, interval: 35 },
    },
    yAxis: [
      {
        type: 'value',
        name: 'CO₂ (ppm)',
        nameTextStyle: { color: '#64748b', fontSize: 11 },
        axisLine: { show: false },
        splitLine: { lineStyle: { color: 'rgba(148,163,184,0.06)' } },
        axisLabel: { color: '#64748b', fontSize: 10 },
      },
      {
        type: 'value',
        name: 'TVOC (ppb)',
        nameTextStyle: { color: '#64748b', fontSize: 11 },
        axisLine: { show: false },
        splitLine: { show: false },
        axisLabel: { color: '#64748b', fontSize: 10 },
      },
    ],
    series: [
      {
        name: 'CO₂ (ppm)',
        type: 'line',
        data: historicalData.map(d => d.co2.toFixed(0)),
        smooth: true,
        symbol: 'none',
        lineStyle: { color: '#10b981', width: 2 },
        areaStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(16,185,129,0.2)' },
              { offset: 1, color: 'rgba(16,185,129,0)' },
            ],
          },
        },
      },
      {
        name: 'TVOC (ppb)',
        type: 'line',
        yAxisIndex: 1,
        data: historicalData.map(d => d.tvoc.toFixed(0)),
        smooth: true,
        symbol: 'none',
        lineStyle: { color: '#a855f7', width: 2 },
        areaStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(168,85,247,0.2)' },
              { offset: 1, color: 'rgba(168,85,247,0)' },
            ],
          },
        },
      },
    ],
  };

  // AQI Gauge per node
  const aqiGaugeOption = (node) => ({
    backgroundColor: 'transparent',
    series: [{
      type: 'gauge',
      startAngle: 220,
      endAngle: -40,
      radius: '90%',
      min: 0,
      max: 500,
      progress: { show: true, width: 14, roundCap: true },
      pointer: { show: false },
      axisLine: { lineStyle: { width: 14, color: [[0.1, '#22c55e'], [0.2, '#eab308'], [0.3, '#f97316'], [0.4, '#ef4444'], [0.6, '#a855f7'], [1, '#991b1b']] } },
      axisTick: { show: false },
      splitLine: { show: false },
      axisLabel: { show: false },
      detail: {
        valueAnimation: true,
        fontSize: 28,
        fontWeight: 700,
        color: getAQIColor(node.latest_aqi),
        offsetCenter: [0, '5%'],
        formatter: '{value}',
      },
      title: {
        fontSize: 12,
        color: '#94a3b8',
        offsetCenter: [0, '55%'],
      },
      data: [{ value: node.latest_aqi, name: node.aqi_info.label }],
    }],
  });

  return (
    <div>
      {/* Top Bar */}
      <div className="top-bar">
        <div>
          <h2>Dashboard</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 2 }}>
            Giám sát chất lượng không khí thời gian thực
          </p>
        </div>
        <div className="top-bar-actions">
          <div className="status-badge">
            <span className="status-dot"></span>
            {currentTime.toLocaleTimeString('vi-VN')}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-header">
            <div>
              <div className="stat-card-label">AQI Trung bình</div>
              <div className="stat-card-value" style={{ color: getAQIColor(avgAQI) }}>
                {avgAQI}
              </div>
            </div>
            <div className="stat-card-icon" style={{ background: 'rgba(99,102,241,0.1)' }}>🌡️</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-header">
            <div>
              <div className="stat-card-label">Node hoạt động</div>
              <div className="stat-card-value">
                {nodes.filter(n => n.status === 'online').length}
                <span className="stat-card-unit">/ {nodes.length}</span>
              </div>
            </div>
            <div className="stat-card-icon" style={{ background: 'rgba(34,197,94,0.1)' }}>📡</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-header">
            <div>
              <div className="stat-card-label">PM2.5 Cao nhất</div>
              <div className="stat-card-value" style={{ color: '#f97316' }}>
                {Math.max(...nodes.map(n => n.latest_pm25)).toFixed(1)}
                <span className="stat-card-unit">µg/m³</span>
              </div>
            </div>
            <div className="stat-card-icon" style={{ background: 'rgba(249,115,22,0.1)' }}>💨</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-header">
            <div>
              <div className="stat-card-label">CO₂ Cao nhất</div>
              <div className="stat-card-value" style={{ color: '#10b981' }}>
                {Math.max(...nodes.map(n => n.latest_co2))}
                <span className="stat-card-unit">ppm</span>
              </div>
            </div>
            <div className="stat-card-icon" style={{ background: 'rgba(16,185,129,0.1)' }}>🏭</div>
          </div>
        </div>
      </div>

      {/* Map + AQI Gauges */}
      <div className="grid-2" style={{ marginBottom: 20 }}>
        {/* Map */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">🗺️ Bản đồ Node</span>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            <div className="map-container">
              <MapContainer center={[10.82, 106.70]} zoom={12} scrollWheelZoom={true} style={{ height: '100%' }}>
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org">OSM</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {nodes.map(node => (
                  <CircleMarker
                    key={node.id}
                    center={[node.latitude, node.longitude]}
                    radius={16}
                    fillColor={getAQIColor(node.latest_aqi)}
                    fillOpacity={0.8}
                    stroke={true}
                    color={getAQIColor(node.latest_aqi)}
                    weight={2}
                  >
                    <Popup>
                      <div>
                        <strong>{node.name}</strong><br />
                        <span>📍 {node.location_name}</span><br />
                        <span>AQI: <strong style={{ color: getAQIColor(node.latest_aqi) }}>{node.latest_aqi}</strong> ({node.aqi_info.label})</span><br />
                        <span>PM2.5: {node.latest_pm25} µg/m³</span><br />
                        <span>CO₂: {node.latest_co2} ppm</span>
                      </div>
                    </Popup>
                  </CircleMarker>
                ))}
              </MapContainer>
            </div>
          </div>
        </div>

        {/* AQI Gauges */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">📊 Chỉ số AQI theo Node</span>
          </div>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: nodes.length > 2 ? '1fr 1fr' : '1fr', gap: 8 }}>
              {nodes.map(node => (
                <div key={node.id} style={{ textAlign: 'center' }}>
                  <ReactECharts option={aqiGaugeOption(node)} style={{ height: 170 }} />
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: -10 }}>
                    {node.name.split(' - ')[1] || node.name}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <span className="card-title">💨 Bụi mịn PM2.5 / PM10 (24h)</span>
          </div>
          <div className="card-body">
            <ReactECharts option={pmChartOption} style={{ height: 300 }} />
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">🏭 CO₂ / TVOC (24h)</span>
          </div>
          <div className="card-body">
            <ReactECharts option={gasChartOption} style={{ height: 300 }} />
          </div>
        </div>
      </div>

      {/* Node Cards */}
      <h3 style={{ fontSize: 16, fontWeight: 600, margin: '24px 0 16px', color: 'var(--text-primary)' }}>
        📡 Trạng thái các Node
      </h3>
      <div className="grid-3">
        {nodes.map(node => (
          <div className="node-card" key={node.id} onClick={() => window.location.href = `/node/${node.id}`}>
            <div className="node-card-header">
              <span className="node-name">{node.name}</span>
              <span className={`node-status ${node.status}`}>{node.status}</span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>
              📍 {node.location_name}
            </div>
            <div className="node-metrics">
              <div className="node-metric">
                <div className="node-metric-label">PM2.5</div>
                <div className="node-metric-value" style={{ color: '#f97316' }}>
                  {node.latest_pm25}<span className="node-metric-unit">µg/m³</span>
                </div>
              </div>
              <div className="node-metric">
                <div className="node-metric-label">AQI</div>
                <div className="node-metric-value" style={{ color: getAQIColor(node.latest_aqi) }}>
                  {node.latest_aqi}
                </div>
              </div>
              <div className="node-metric">
                <div className="node-metric-label">CO₂</div>
                <div className="node-metric-value" style={{ color: '#10b981' }}>
                  {node.latest_co2}<span className="node-metric-unit">ppm</span>
                </div>
              </div>
              <div className="node-metric">
                <div className="node-metric-label">Pin</div>
                <div className="node-metric-value" style={{ color: node.latest_battery < 20 ? '#ef4444' : '#3b82f6' }}>
                  {node.latest_battery}<span className="node-metric-unit">%</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
