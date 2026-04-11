import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  Radio, Router, AlertTriangle, Wind, Activity,
  ArrowRight, Clock, Plus, Pencil, Trash2, KeyRound,
  ShieldAlert, Wifi, WifiOff, BatteryMedium,
} from 'lucide-react';
import ReactECharts from 'echarts-for-react';
import { useAdminDashboard } from '@/hooks/useAdminDashboard';
import { PageLoader } from '@/components/ui/Spinner/Spinner';
import Badge from '@/components/ui/Badge/Badge';
import styles from './AdminDashboard.module.css';

// ── Helpers ──

function timeAgo(dateStr, t) {
  if (!dateStr) return t('adminDash.never');
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return t('adminDash.justNow');
  if (mins < 60) return `${mins} ${t('adminDash.minutesAgo')}`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} ${t('adminDash.hoursAgo')}`;
  const days = Math.floor(hours / 24);
  return `${days} ${t('adminDash.daysAgo')}`;
}

const ACTION_ICONS = {
  CREATE: Plus,
  UPDATE: Pencil,
  DELETE: Trash2,
  LOGIN: KeyRound,
  CHANGE_PASSWORD: KeyRound,
};

const ACTION_COLORS = {
  CREATE: 'var(--color-success)',
  UPDATE: 'var(--color-info)',
  DELETE: 'var(--color-danger)',
  LOGIN: 'var(--color-primary-500)',
  CHANGE_PASSWORD: 'var(--color-warning)',
};

function getAqiColor(aqi) {
  if (aqi <= 50) return '#22C55E';
  if (aqi <= 100) return '#EAB308';
  if (aqi <= 150) return '#F97316';
  if (aqi <= 200) return '#EF4444';
  if (aqi <= 300) return '#8B5CF6';
  return '#991B1B';
}

function getSeverityVariant(severity) {
  if (severity === 'danger') return 'danger';
  if (severity === 'warn' || severity === 'warning') return 'warning';
  return 'default';
}

// ── Main Component ──

export default function AdminDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { stats, loading } = useAdminDashboard();

  if (loading) return <PageLoader />;
  if (!stats) return <PageLoader />;

  const { nodes, gateways, alerts, avgAqi, avgAqiInfo, nodeAqiList, recentAlerts, recentLogs, uptime } = stats;

  // ── AQI Chart Options ──
  const chartOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params) => {
        const p = params[0];
        return `<strong>${p.name}</strong><br/>AQI: <strong>${p.value}</strong>`;
      },
    },
    grid: { left: 8, right: 24, top: 8, bottom: 4, containLabel: true },
    xAxis: {
      type: 'value',
      max: 500,
      axisLabel: { fontSize: 11, color: '#94A3B8' },
      splitLine: { lineStyle: { color: '#F1F5F9' } },
    },
    yAxis: {
      type: 'category',
      data: nodeAqiList.map(n => n.name).reverse(),
      axisLabel: { fontSize: 12, color: '#475569', width: 100, overflow: 'truncate' },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    series: [{
      type: 'bar',
      data: nodeAqiList.map(n => ({
        value: n.aqi,
        itemStyle: {
          color: getAqiColor(n.aqi),
          borderRadius: [0, 6, 6, 0],
        },
      })).reverse(),
      barWidth: 20,
      label: {
        show: true,
        position: 'right',
        formatter: '{c}',
        fontSize: 11,
        fontWeight: 600,
        color: '#475569',
      },
    }],
    animationDuration: 800,
    animationEasing: 'cubicOut',
  };

  const chartHeight = Math.max(180, nodeAqiList.length * 44);

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>{t('adminDash.title')}</h1>
          <p className={styles.subtitle}>{t('adminDash.subtitle')}</p>
        </div>
      </div>

      {/* ① Stat Cards */}
      <div className={styles.statGrid}>
        <StatCard
          icon={Radio}
          label={t('adminDash.sensorNodes')}
          value={nodes.active}
          total={nodes.total}
          suffix={`/ ${nodes.total}`}
          color="#6366F1"
          bgGradient="linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)"
        />
        <StatCard
          icon={Router}
          label={t('adminDash.gateways')}
          value={gateways.online}
          total={gateways.total}
          suffix={`/ ${gateways.total}`}
          color="#3B82F6"
          bgGradient="linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)"
        />
        <StatCard
          icon={AlertTriangle}
          label={t('adminDash.pendingAlerts')}
          value={alerts.unacknowledged}
          color={alerts.unacknowledged > 0 ? '#EF4444' : '#22C55E'}
          bgGradient={alerts.unacknowledged > 0
            ? 'linear-gradient(135deg, #FEF2F2 0%, #FECACA 100%)'
            : 'linear-gradient(135deg, #F0FDF4 0%, #BBF7D0 100%)'}
        />
        <StatCard
          icon={Wind}
          label={t('adminDash.avgAqi')}
          value={avgAqi}
          color={avgAqiInfo ? getAqiColor(avgAqi) : '#94A3B8'}
          bgGradient="linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)"
          badge={avgAqiInfo?.label}
          badgeColor={avgAqiInfo ? getAqiColor(avgAqi) : undefined}
        />
        <StatCard
          icon={Activity}
          label={t('adminDash.systemUptime')}
          value={uptime}
          suffix="%"
          color={uptime >= 80 ? '#22C55E' : uptime >= 50 ? '#F59E0B' : '#EF4444'}
          bgGradient={uptime >= 80
            ? 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)'
            : 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)'}
        />
      </div>

      {/* ② + ③ Row */}
      <div className={styles.twoCol}>
        {/* ② AQI Overview Chart */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>
              <Wind size={18} />
              {t('adminDash.aqiOverview')}
            </h3>
          </div>
          <div className={styles.cardContent}>
            {nodeAqiList.length > 0 ? (
              <ReactECharts
                option={chartOption}
                style={{ height: chartHeight, width: '100%' }}
                opts={{ renderer: 'svg' }}
              />
            ) : (
              <div className={styles.emptyState}>{t('adminDash.noNodes')}</div>
            )}
          </div>
        </div>

        {/* ③ Recent Alerts */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>
              <ShieldAlert size={18} />
              {t('adminDash.recentAlerts')}
            </h3>
            <button className={styles.viewAllBtn} onClick={() => navigate('/admin/alerts')}>
              {t('adminDash.viewAll')} <ArrowRight size={14} />
            </button>
          </div>
          <div className={styles.cardContent}>
            {recentAlerts.length > 0 ? (
              <ul className={styles.alertList}>
                {recentAlerts.map(alert => (
                  <li key={alert.id} className={styles.alertItem}>
                    <div className={styles.alertIcon} data-severity={alert.severity}>
                      <AlertTriangle size={16} />
                    </div>
                    <div className={styles.alertInfo}>
                      <span className={styles.alertMessage}>{alert.message}</span>
                      <span className={styles.alertMeta}>
                        <Badge variant={getSeverityVariant(alert.severity)} size="sm">
                          {alert.severity}
                        </Badge>
                        <span className={styles.alertTime}>
                          <Clock size={12} />{timeAgo(alert.created_at, t)}
                        </span>
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className={styles.emptyState}>{t('adminDash.noAlerts')}</div>
            )}
          </div>
        </div>
      </div>

      {/* ④ + ⑤ Row */}
      <div className={styles.twoCol}>
        {/* ④ Device Health */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>
              <Radio size={18} />
              {t('adminDash.deviceHealth')}
            </h3>
            <button className={styles.viewAllBtn} onClick={() => navigate('/admin/nodes')}>
              {t('adminDash.viewAll')} <ArrowRight size={14} />
            </button>
          </div>
          <div className={styles.cardContent}>
            <div className={styles.deviceTable}>
              <div className={styles.deviceTableHeader}>
                <span>{t('adminDash.deviceName')}</span>
                <span>{t('adminDash.deviceStatus')}</span>
                <span>{t('adminDash.deviceBattery')}</span>
                <span>{t('adminDash.deviceLastSeen')}</span>
              </div>
              {nodeAqiList.length > 0 ? nodeAqiList.map(node => (
                <div
                  key={node.node_id}
                  className={styles.deviceRow}
                  onClick={() => navigate(`/station/${node.node_id}`)}
                >
                  <span className={styles.deviceName}>
                    {node.status === 'active' ? <Wifi size={14} className={styles.iconOnline} /> : <WifiOff size={14} className={styles.iconOffline} />}
                    {node.name}
                  </span>
                  <span>
                    <Badge variant={node.status === 'active' ? 'success' : 'danger'} size="sm">
                      {node.status}
                    </Badge>
                  </span>
                  <span className={styles.batteryCell}>
                    <BatteryMedium size={14} />
                    <div className={styles.batteryBar}>
                      <div
                        className={styles.batteryFill}
                        style={{
                          width: `${node.battery_level}%`,
                          backgroundColor: node.battery_level > 50 ? '#22C55E' : node.battery_level > 20 ? '#F59E0B' : '#EF4444',
                        }}
                      />
                    </div>
                    <span className={styles.batteryText}>{node.battery_level}%</span>
                  </span>
                  <span className={styles.lastSeenText}>
                    {timeAgo(node.last_measurement, t)}
                  </span>
                </div>
              )) : (
                <div className={styles.emptyState}>{t('adminDash.noNodes')}</div>
              )}
            </div>
          </div>
        </div>

        {/* ⑤ Recent Activity */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>
              <Clock size={18} />
              {t('adminDash.recentActivity')}
            </h3>
            <button className={styles.viewAllBtn} onClick={() => navigate('/admin/logs')}>
              {t('adminDash.viewAll')} <ArrowRight size={14} />
            </button>
          </div>
          <div className={styles.cardContent}>
            {recentLogs.length > 0 ? (
              <ul className={styles.logList}>
                {recentLogs.map(log => {
                  const ActionIcon = ACTION_ICONS[log.action] || Clock;
                  const actionColor = ACTION_COLORS[log.action] || 'var(--text-tertiary)';
                  return (
                    <li key={log.id} className={styles.logItem}>
                      <div className={styles.logIcon} style={{ color: actionColor, backgroundColor: `${actionColor}15` }}>
                        <ActionIcon size={14} />
                      </div>
                      <div className={styles.logInfo}>
                        <span className={styles.logMessage}>
                          <strong>{log.username}</strong>
                          {' • '}
                          {log.action} {log.resource}
                          {log.resource_id ? ` (${log.resource_id})` : ''}
                        </span>
                        <span className={styles.logTime}>
                          <Clock size={12} />{timeAgo(log.created_at, t)}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className={styles.emptyState}>{t('adminDash.noActivity')}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── StatCard Sub-component ──

function StatCard({ icon: Icon, label, value, total, suffix, color, bgGradient, badge, badgeColor }) {
  return (
    <div className={styles.statCard} style={{ background: bgGradient }}>
      <div className={styles.statIconBox} style={{ color, backgroundColor: `${color}18` }}>
        <Icon size={22} />
      </div>
      <div className={styles.statContent}>
        <span className={styles.statLabel}>{label}</span>
        <div className={styles.statValueRow}>
          <span className={styles.statValue} style={{ color }}>{value}{suffix}</span>
          {badge && (
            <span className={styles.statBadge} style={{ color: badgeColor, backgroundColor: `${badgeColor}18` }}>
              {badge}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
