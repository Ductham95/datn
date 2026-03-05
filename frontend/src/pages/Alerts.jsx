import { useState } from 'react';

const DEMO_ALERTS = [
  {
    id: 1, node_id: 2, node_name: 'Node 02 - Công nghiệp',
    alert_type: 'aqi', level: 'danger',
    message: 'AQI = 156 (Không tốt cho sức khỏe)', value: 156, threshold: 150,
    acknowledged: false, created_at: '2026-03-05T13:45:00',
  },
  {
    id: 2, node_id: 2, node_name: 'Node 02 - Công nghiệp',
    alert_type: 'co2', level: 'warning',
    message: 'CO₂ = 1250 ppm (Kém - Buồn ngủ, giảm tập trung)', value: 1250, threshold: 1000,
    acknowledged: false, created_at: '2026-03-05T13:45:00',
  },
  {
    id: 3, node_id: 2, node_name: 'Node 02 - Công nghiệp',
    alert_type: 'tvoc', level: 'warning',
    message: 'TVOC = 420 ppb (Kém - Có thể gây kích ứng)', value: 420, threshold: 220,
    acknowledged: false, created_at: '2026-03-05T13:45:00',
  },
  {
    id: 4, node_id: 1, node_name: 'Node 01 - Trung tâm',
    alert_type: 'aqi', level: 'warning',
    message: 'AQI = 112 (Không tốt cho nhóm nhạy cảm)', value: 112, threshold: 100,
    acknowledged: true, created_at: '2026-03-05T10:22:00',
  },
  {
    id: 5, node_id: 3, node_name: 'Node 03 - Ngoại ô',
    alert_type: 'battery', level: 'warning',
    message: 'Pin yếu: 18%', value: 18, threshold: 20,
    acknowledged: true, created_at: '2026-03-04T22:10:00',
  },
];

const alertIcons = {
  aqi: '💨', co2: '🏭', tvoc: '🧪', battery: '🔋', offline: '📡',
};

const levelColors = {
  warning: { bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)', text: '#f59e0b' },
  danger: { bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)', text: '#ef4444' },
  critical: { bg: 'rgba(168,85,247,0.08)', border: 'rgba(168,85,247,0.2)', text: '#a855f7' },
};

export default function Alerts() {
  const [alerts, setAlerts] = useState(DEMO_ALERTS);
  const [filter, setFilter] = useState('all'); // all, unread, aqi, co2, tvoc, battery

  const handleAcknowledge = (alertId) => {
    setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, acknowledged: true } : a));
  };

  const filtered = alerts.filter(a => {
    if (filter === 'unread') return !a.acknowledged;
    if (filter === 'all') return true;
    return a.alert_type === filter;
  });

  const unreadCount = alerts.filter(a => !a.acknowledged).length;

  return (
    <div>
      {/* Top Bar */}
      <div className="top-bar">
        <div>
          <h2>🔔 Cảnh báo</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 2 }}>
            {unreadCount} cảnh báo chưa xử lý
          </p>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {[
          { key: 'all', label: 'Tất cả', icon: '📋' },
          { key: 'unread', label: `Chưa đọc (${unreadCount})`, icon: '🔴' },
          { key: 'aqi', label: 'AQI', icon: '💨' },
          { key: 'co2', label: 'CO₂', icon: '🏭' },
          { key: 'tvoc', label: 'TVOC', icon: '🧪' },
          { key: 'battery', label: 'Pin', icon: '🔋' },
        ].map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)} style={{
            padding: '8px 16px', borderRadius: 'var(--radius-sm)', fontSize: 13, cursor: 'pointer',
            border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 6,
            background: filter === f.key ? 'var(--primary)' : 'var(--bg-card)',
            color: filter === f.key ? 'white' : 'var(--text-secondary)',
            transition: 'all var(--transition-fast)',
          }}>
            <span>{f.icon}</span> {f.label}
          </button>
        ))}
      </div>

      {/* Alert List */}
      <div className="card">
        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">✅</div>
            <h3>Không có cảnh báo</h3>
            <p>Tất cả các thông số đều trong mức an toàn</p>
          </div>
        ) : (
          filtered.map(alert => {
            const colors = levelColors[alert.level] || levelColors.warning;
            return (
              <div className="alert-item" key={alert.id} style={{
                opacity: alert.acknowledged ? 0.5 : 1,
                borderLeft: `3px solid ${colors.text}`,
              }}>
                <div className="alert-icon" style={{ background: colors.bg }}>
                  {alertIcons[alert.alert_type] || '⚠️'}
                </div>
                <div className="alert-content">
                  <div className="alert-message" style={{ color: alert.acknowledged ? 'var(--text-muted)' : 'var(--text-primary)' }}>
                    {alert.message}
                  </div>
                  <div className="alert-meta">
                    📡 {alert.node_name} • 🕐 {new Date(alert.created_at).toLocaleString('vi-VN')}
                    {alert.acknowledged && ' • ✅ Đã xử lý'}
                  </div>
                </div>
                {!alert.acknowledged && (
                  <button className="alert-action" onClick={() => handleAcknowledge(alert.id)}>
                    Xác nhận
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
