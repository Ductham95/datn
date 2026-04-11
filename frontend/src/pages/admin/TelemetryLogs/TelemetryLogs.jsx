import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Activity, Filter, RotateCcw, RefreshCw, Database } from 'lucide-react';
import { io } from 'socket.io-client';
import { telemetryLogService } from '@/services/adminService';
import { deviceService } from '@/services/deviceService';
import DataTable from '@/components/ui/DataTable/DataTable';
import { formatDateTime, formatNumber } from '@/utils/formatters';
import { getAQIColor } from '@/utils/aqi';
import { SOCKET_URL, SOCKET_EVENTS } from '@/utils/constants';
import toast from 'react-hot-toast';
import styles from './TelemetryLogs.module.css';

export default function TelemetryLogs() {
  const { t } = useTranslation();
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [nodes, setNodes] = useState([]);

  // Filters
  const [filterNode, setFilterNode] = useState('');
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');

  // Realtime
  const [newCount, setNewCount] = useState(0);
  const socketRef = useRef(null);

  // Fetch node list cho dropdown
  useEffect(() => {
    deviceService.getNodes()
      .then(data => setNodes(data.data || []))
      .catch(() => {});
  }, []);

  // Fetch telemetry logs
  const fetchData = useCallback(async (filters = {}) => {
    setLoading(true);
    try {
      const params = {};
      if (filters.node_id || filterNode) params.node_id = filters.node_id || filterNode;
      if (filters.from || filterFrom) params.from = filters.from || filterFrom;
      if (filters.to || filterTo) params.to = filters.to || filterTo;
      params.limit = 500;

      const result = await telemetryLogService.getLogs(params);
      setLogs(result.data || []);
      setTotal(result.total || 0);
      setNewCount(0);
    } catch (err) {
      toast.error('Không thể tải telemetry logs');
    } finally {
      setLoading(false);
    }
  }, [filterNode, filterFrom, filterTo]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Socket.IO — listen for new telemetry
  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
    });
    socketRef.current = socket;

    socket.on(SOCKET_EVENTS.NEW_TELEMETRY, () => {
      setNewCount(prev => prev + 1);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  const handleFilter = () => {
    fetchData({ node_id: filterNode, from: filterFrom, to: filterTo });
  };

  const handleReset = () => {
    setFilterNode('');
    setFilterFrom('');
    setFilterTo('');
    fetchData({ node_id: '', from: '', to: '' });
  };

  const handleRefreshNew = () => {
    fetchData();
  };

  // --- Column definitions ---
  const columns = [
    {
      key: 'time', label: 'Thời gian', sortable: true, width: '170px',
      render: (val) => formatDateTime(val),
    },
    {
      key: 'node_name', label: 'Node', sortable: true, width: '160px',
      render: (val, row) => (
        <div className={styles.nodeCell}>
          <span className={styles.nodeName}>{val}</span>
          <span className={styles.nodeId}>{row.node_id}</span>
        </div>
      ),
    },
    {
      key: 'pm25', label: 'PM2.5', sortable: true, width: '100px',
      render: (val) => (
        <span className={val > 55.4 ? styles.metricDanger : val > 35.4 ? styles.metricWarn : styles.metricNormal}>
          {formatNumber(val)}
          <span className={styles.metricUnit}>µg/m³</span>
        </span>
      ),
    },
    {
      key: 'pm10', label: 'PM10', sortable: true, width: '100px',
      render: (val) => (
        <span className={val > 254 ? styles.metricDanger : val > 154 ? styles.metricWarn : styles.metricNormal}>
          {formatNumber(val)}
          <span className={styles.metricUnit}>µg/m³</span>
        </span>
      ),
    },
    {
      key: 'co2', label: 'CO₂', sortable: true, width: '90px',
      render: (val) => (
        <span className={val > 2000 ? styles.metricDanger : val > 1000 ? styles.metricWarn : styles.metricNormal}>
          {val ?? '--'}
          <span className={styles.metricUnit}>ppm</span>
        </span>
      ),
    },
    {
      key: 'tvoc', label: 'TVOC', sortable: true, width: '90px',
      render: (val) => (
        <span className={val > 1000 ? styles.metricDanger : val > 500 ? styles.metricWarn : styles.metricNormal}>
          {val ?? '--'}
          <span className={styles.metricUnit}>ppb</span>
        </span>
      ),
    },
    {
      key: 'temperature', label: 'Nhiệt độ', sortable: true, width: '90px',
      render: (val) => (
        <span className={styles.metricNormal}>
          {formatNumber(val)}<span className={styles.metricUnit}>°C</span>
        </span>
      ),
    },
    {
      key: 'humidity', label: 'Độ ẩm', sortable: true, width: '90px',
      render: (val) => (
        <span className={styles.metricNormal}>
          {formatNumber(val)}<span className={styles.metricUnit}>%</span>
        </span>
      ),
    },
    {
      key: 'aqi', label: 'AQI', sortable: true, width: '70px',
      render: (val) => (
        <span
          className={styles.aqiBadge}
          style={{ background: getAQIColor(val) }}
        >
          {val}
        </span>
      ),
    },
  ];

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>{t('admin.telemetryLogs')}</h1>
          <p className={styles.subtitle}>Xem dữ liệu thô từ các sensor node gửi về qua gateway</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className={styles.filterBar}>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Sensor Node</label>
          <select
            className={styles.filterSelect}
            value={filterNode}
            onChange={(e) => setFilterNode(e.target.value)}
          >
            <option value="">Tất cả nodes</option>
            {nodes.map(n => (
              <option key={n.id} value={n.id}>{n.name} ({n.id})</option>
            ))}
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Từ ngày</label>
          <input
            type="datetime-local"
            className={styles.filterInput}
            value={filterFrom}
            onChange={(e) => setFilterFrom(e.target.value)}
          />
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Đến ngày</label>
          <input
            type="datetime-local"
            className={styles.filterInput}
            value={filterTo}
            onChange={(e) => setFilterTo(e.target.value)}
          />
        </div>

        <div className={styles.filterActions}>
          <button className={`${styles.btnFilter} ${styles.primary}`} onClick={handleFilter}>
            <Filter size={14} />
            Lọc
          </button>
          <button className={`${styles.btnFilter} ${styles.ghost}`} onClick={handleReset}>
            <RotateCcw size={14} />
            Reset
          </button>
        </div>
      </div>

      {/* Realtime Banner */}
      {newCount > 0 && (
        <div className={styles.realtimeBanner}>
          <div className={styles.realtimeBannerText}>
            <span className={styles.pulseDot} />
            <span>{newCount} bản ghi mới từ sensor</span>
          </div>
          <button className={styles.btnRefresh} onClick={handleRefreshNew}>
            <RefreshCw size={14} />
            Tải lại
          </button>
        </div>
      )}

      {/* Stats */}
      <div className={styles.statsBar}>
        <div className={styles.statItem}>
          <Database size={14} />
          <span>Tổng khớp filter: <span className={styles.statValue}>{total.toLocaleString()}</span></span>
        </div>
        <div className={styles.statItem}>
          <span>Hiển thị: <span className={styles.statValue}>{logs.length}</span> (tối đa 500)</span>
        </div>
      </div>

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={logs}
        loading={loading}
        searchPlaceholder="Tìm theo node..."
        searchKeys={['node_id', 'node_name']}
        emptyTitle="Chưa có telemetry logs"
        emptyDescription="Chưa có dữ liệu đo lường nào từ sensor node"
        emptyIcon={Activity}
        pageSize={20}
      />
    </div>
  );
}
