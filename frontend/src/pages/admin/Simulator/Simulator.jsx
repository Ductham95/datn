import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { FlaskConical, Database, Clock, Radio, Play, Square, MapPin } from 'lucide-react';
import api from '@/services/api';
import Button from '@/components/ui/Button/Button';
import toast from 'react-hot-toast';
import styles from './Simulator.module.css';

export default function Simulator() {
  const { t } = useTranslation();
  const [nodes, setNodes] = useState([]);
  const [selectedNodeIds, setSelectedNodeIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);

  // Realtime state
  const [rtStatus, setRtStatus] = useState({ running: false, tickCount: 0 });
  const [rtInterval, setRtInterval] = useState(10);
  const [rtStarting, setRtStarting] = useState(false);
  const pollRef = useRef(null);

  // Default: 7 ngày trước → hôm nay
  const today = new Date();
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const [form, setForm] = useState({
    from: weekAgo.toISOString().slice(0, 16),
    to: today.toISOString().slice(0, 16),
    intervalMinutes: 5,
  });

  const fetchNodes = useCallback(async () => {
    try {
      const res = await api.get('/api/v1/admin/simulator/nodes');
      const data = res.data?.data || [];
      setNodes(data);
      setSelectedNodeIds(data.map(n => n.id));
    } catch {
      toast.error('Không thể tải danh sách nodes');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch realtime status
  const fetchRtStatus = useCallback(async () => {
    try {
      const res = await api.get('/api/v1/admin/simulator/realtime/status');
      setRtStatus(res.data?.data || { running: false, tickCount: 0 });
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    fetchNodes();
    fetchRtStatus();
  }, [fetchNodes, fetchRtStatus]);

  // Poll realtime status while running
  useEffect(() => {
    if (rtStatus.running && !pollRef.current) {
      pollRef.current = setInterval(fetchRtStatus, 3000);
    } else if (!rtStatus.running && pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [rtStatus.running, fetchRtStatus]);

  const toggleNode = (id) => {
    setSelectedNodeIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const selectAll = () => setSelectedNodeIds(nodes.map(n => n.id));
  const selectNone = () => setSelectedNodeIds([]);

  // ===== Backfill =====
  const handleBackfill = async (e) => {
    e.preventDefault();
    if (selectedNodeIds.length === 0) {
      toast.error('Chọn ít nhất 1 node');
      return;
    }

    setRunning(true);
    setResult(null);

    try {
      const res = await api.post('/api/v1/admin/simulator/backfill', {
        nodeIds: selectedNodeIds,
        from: new Date(form.from).toISOString(),
        to: new Date(form.to).toISOString(),
        intervalMinutes: parseInt(form.intervalMinutes, 10),
      });

      if (res.data?.success) {
        const created = res.data.data.created;
        setResult({ type: 'success', message: `✅ Backfill hoàn tất! Đã tạo ${created.toLocaleString()} bản ghi.` });
        toast.success(`Đã tạo ${created.toLocaleString()} bản ghi`);
      } else {
        setResult({ type: 'error', message: res.data?.error || 'Lỗi không xác định' });
      }
    } catch (err) {
      const msg = err.response?.data?.error || err.message;
      setResult({ type: 'error', message: `❌ Lỗi: ${msg}` });
      toast.error(msg);
    } finally {
      setRunning(false);
    }
  };

  // ===== Realtime =====
  const handleStartRealtime = async () => {
    if (selectedNodeIds.length === 0) {
      toast.error('Chọn ít nhất 1 node');
      return;
    }
    setRtStarting(true);
    try {
      await api.post('/api/v1/admin/simulator/realtime/start', {
        nodeIds: selectedNodeIds,
        intervalSeconds: parseInt(rtInterval, 10),
      });
      toast.success('Realtime simulation đã bắt đầu!');
      fetchRtStatus();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Không thể bắt đầu realtime');
    } finally {
      setRtStarting(false);
    }
  };

  const handleStopRealtime = async () => {
    try {
      const res = await api.post('/api/v1/admin/simulator/realtime/stop');
      const data = res.data?.data;
      toast.success(`Đã dừng! ${data?.tickCount || 0} ticks trong ${data?.duration || 0}s`);
      fetchRtStatus();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Không thể dừng realtime');
    }
  };

  // Ước tính số bản ghi
  const estimateRecords = () => {
    const fromDate = new Date(form.from);
    const toDate = new Date(form.to);
    if (isNaN(fromDate) || isNaN(toDate) || fromDate >= toDate) return 0;
    const totalMinutes = (toDate - fromDate) / 60000;
    return Math.floor(totalMinutes / (form.intervalMinutes || 5)) * selectedNodeIds.length;
  };

  // Provision state
  const [provisionJson, setProvisionJson] = useState('');
  const [provisioning, setProvisioning] = useState(false);
  const [provisionResult, setProvisionResult] = useState(null);

  const PRESET_NODES = [
    { name:'Sensor Điện Biên', gateway_id:'GW_001', lat:21.386, lng:103.023 },
    { name:'Sensor Sơn La', gateway_id:'GW_001', lat:21.326, lng:103.919 },
    { name:'Sensor Lai Châu', gateway_id:'GW_001', lat:22.396, lng:103.458 },
    { name:'Sensor Lào Cai', gateway_id:'GW_001', lat:22.486, lng:103.971 },
    { name:'Sensor Sa Pa', gateway_id:'GW_001', lat:22.336, lng:103.844 },
    { name:'Sensor Hà Giang', gateway_id:'GW_001', lat:22.823, lng:104.984 },
    { name:'Sensor Cao Bằng', gateway_id:'GW_001', lat:22.667, lng:106.252 },
    { name:'Sensor Lạng Sơn', gateway_id:'GW_001', lat:21.846, lng:106.757 },
    { name:'Sensor Thái Nguyên', gateway_id:'GW_001', lat:21.593, lng:105.844 },
    { name:'Sensor Tuyên Quang', gateway_id:'GW_001', lat:21.823, lng:105.218 },
    { name:'Sensor Yên Bái', gateway_id:'GW_001', lat:21.722, lng:104.911 },
    { name:'Sensor Bắc Kạn', gateway_id:'GW_001', lat:22.147, lng:105.834 },
    { name:'Sensor Hà Nội', gateway_id:'GW_001', lat:21.029, lng:105.854 },
    { name:'Sensor Đông Anh', gateway_id:'GW_001', lat:21.139, lng:105.847 },
    { name:'Sensor Hà Đông', gateway_id:'GW_001', lat:20.972, lng:105.778 },
    { name:'Sensor Gia Lâm', gateway_id:'GW_001', lat:21.013, lng:105.937 },
    { name:'Sensor Sơn Tây', gateway_id:'GW_001', lat:21.138, lng:105.505 },
    { name:'Sensor Mê Linh', gateway_id:'GW_001', lat:21.188, lng:105.725 },
    { name:'Sensor Thạch Thất', gateway_id:'GW_001', lat:21.016, lng:105.556 },
    { name:'Sensor Thanh Trì', gateway_id:'GW_001', lat:20.944, lng:105.861 },
    { name:'Sensor Bắc Ninh', gateway_id:'GW_001', lat:21.186, lng:106.076 },
    { name:'Sensor Từ Sơn', gateway_id:'GW_001', lat:21.120, lng:105.968 },
    { name:'Sensor Bắc Giang', gateway_id:'GW_001', lat:21.273, lng:106.195 },
    { name:'Sensor Hải Dương', gateway_id:'GW_001', lat:20.937, lng:106.315 },
    { name:'Sensor Chí Linh', gateway_id:'GW_001', lat:21.130, lng:106.393 },
    { name:'Sensor Hải Phòng', gateway_id:'GW_001', lat:20.845, lng:106.688 },
    { name:'Sensor Đồ Sơn', gateway_id:'GW_001', lat:20.714, lng:106.784 },
    { name:'Sensor Hạ Long', gateway_id:'GW_001', lat:20.951, lng:107.075 },
    { name:'Sensor Cẩm Phả', gateway_id:'GW_001', lat:21.013, lng:107.313 },
    { name:'Sensor Móng Cái', gateway_id:'GW_001', lat:21.523, lng:107.965 },
    { name:'Sensor Uông Bí', gateway_id:'GW_001', lat:21.036, lng:106.783 },
    { name:'Sensor Vĩnh Phúc', gateway_id:'GW_001', lat:21.309, lng:105.605 },
    { name:'Sensor Phú Thọ', gateway_id:'GW_001', lat:21.422, lng:105.230 },
    { name:'Sensor Việt Trì', gateway_id:'GW_001', lat:21.323, lng:105.402 },
    { name:'Sensor Hòa Bình', gateway_id:'GW_001', lat:20.817, lng:105.338 },
    { name:'Sensor Hưng Yên', gateway_id:'GW_001', lat:20.646, lng:106.051 },
    { name:'Sensor Hà Nam', gateway_id:'GW_001', lat:20.584, lng:105.923 },
    { name:'Sensor Thái Bình', gateway_id:'GW_001', lat:20.446, lng:106.337 },
    { name:'Sensor Tiền Hải', gateway_id:'GW_001', lat:20.326, lng:106.554 },
    { name:'Sensor Nam Định', gateway_id:'GW_001', lat:20.439, lng:106.162 },
    { name:'Sensor Ninh Bình', gateway_id:'GW_001', lat:20.251, lng:105.975 },
    { name:'Sensor Tam Điệp', gateway_id:'GW_001', lat:20.151, lng:105.902 },
    { name:'Sensor Tam Cốc', gateway_id:'GW_001', lat:20.215, lng:105.938 },
    { name:'Sensor Thanh Hóa', gateway_id:'GW_001', lat:19.807, lng:105.785 },
    { name:'Sensor Vinh', gateway_id:'GW_001', lat:18.679, lng:105.681 },
    { name:'Sensor Đồng Hới', gateway_id:'GW_001', lat:17.469, lng:106.600 },
    { name:'Sensor Huế', gateway_id:'GW_001', lat:16.464, lng:107.591 },
    { name:'Sensor Đà Nẵng', gateway_id:'GW_001', lat:16.054, lng:108.202 },
    { name:'Sensor Quảng Ngãi', gateway_id:'GW_001', lat:15.121, lng:108.804 },
    { name:'Sensor Quy Nhơn', gateway_id:'GW_001', lat:13.783, lng:109.220 },
    { name:'Sensor Nha Trang', gateway_id:'GW_001', lat:12.239, lng:109.197 },
    { name:'Sensor Phan Thiết', gateway_id:'GW_001', lat:10.933, lng:108.100 },
    { name:'Sensor Kon Tum', gateway_id:'GW_001', lat:14.350, lng:108.001 },
    { name:'Sensor Pleiku', gateway_id:'GW_001', lat:13.983, lng:108.000 },
    { name:'Sensor Buôn Ma Thuột', gateway_id:'GW_001', lat:12.668, lng:108.038 },
    { name:'Sensor Đà Lạt', gateway_id:'GW_001', lat:11.940, lng:108.458 },
    { name:'Sensor TP.HCM', gateway_id:'GW_001', lat:10.823, lng:106.630 },
    { name:'Sensor Biên Hòa', gateway_id:'GW_001', lat:10.945, lng:106.824 },
    { name:'Sensor Vũng Tàu', gateway_id:'GW_001', lat:10.346, lng:107.084 },
    { name:'Sensor Thủ Dầu Một', gateway_id:'GW_001', lat:11.003, lng:106.652 },
    { name:'Sensor Tây Ninh', gateway_id:'GW_001', lat:11.310, lng:106.098 },
    { name:'Sensor Cần Thơ', gateway_id:'GW_001', lat:10.045, lng:105.747 },
    { name:'Sensor Rạch Giá', gateway_id:'GW_001', lat:10.013, lng:105.081 },
    { name:'Sensor Cà Mau', gateway_id:'GW_001', lat:9.177, lng:105.152 },
    { name:'Sensor Long Xuyên', gateway_id:'GW_001', lat:10.386, lng:105.435 },
    { name:'Sensor Phú Quốc', gateway_id:'GW_001', lat:10.228, lng:103.964 },
  ];

  const loadPreset = () => {
    setProvisionJson(JSON.stringify(PRESET_NODES, null, 2));
  };

  const handleProvision = async () => {
    let nodeDefs;
    try {
      nodeDefs = JSON.parse(provisionJson);
    } catch {
      toast.error('JSON không hợp lệ');
      return;
    }
    if (!Array.isArray(nodeDefs) || nodeDefs.length === 0) {
      toast.error('Cần mảng node không rỗng');
      return;
    }

    setProvisioning(true);
    setProvisionResult(null);
    try {
      const res = await api.post('/api/v1/admin/simulator/provision', { nodes: nodeDefs });
      if (res.data?.success) {
        const d = res.data.data;
        const msg = `✅ Tạo ${d.created} node mới, bỏ qua ${d.skipped} đã có` + (d.errors ? `, ${d.errors} lỗi` : '');
        setProvisionResult({ type: d.errors ? 'error' : 'success', message: msg });
        toast.success(`Tạo ${d.created} node mới`);
        fetchNodes(); // Refresh danh sách
      }
    } catch (err) {
      const msg = err.response?.data?.error || err.message;
      setProvisionResult({ type: 'error', message: `❌ ${msg}` });
      toast.error(msg);
    } finally {
      setProvisioning(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>{t('admin.simulator')}</h1>
          <p className={styles.subtitle}>Tạo node giả lập và sinh dữ liệu để test giao diện</p>
        </div>
      </div>

      {/* Card: Provision nodes */}
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>
          <MapPin size={18} /> Tạo Node giả lập
        </h2>
        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', margin: '0 0 var(--space-3) 0' }}>
          Nhập JSON danh sách node hoặc dùng preset {PRESET_NODES.length} tỉnh thành Việt Nam.
        </p>

        <div className={styles.nodeActions}>
          <button className={styles.linkBtn} onClick={loadPreset}>
            📋 Load preset ({PRESET_NODES.length} tỉnh thành)
          </button>
        </div>

        <textarea
          className={styles.fieldInput}
          style={{ minHeight: 120, fontFamily: 'monospace', fontSize: 'var(--font-size-xs)' }}
          placeholder='[{"name":"Sensor ABC","gateway_id":"GW_001","lat":21.03,"lng":105.85}]'
          value={provisionJson}
          onChange={(e) => setProvisionJson(e.target.value)}
        />

        <div className={styles.formActions} style={{ marginTop: 'var(--space-3)' }}>
          <Button onClick={handleProvision} loading={provisioning} disabled={provisioning || !provisionJson.trim()}>
            <MapPin size={16} /> Tạo Nodes
          </Button>
        </div>

        {provisionResult && (
          <div className={`${styles.result} ${provisionResult.type === 'success' ? styles.resultSuccess : styles.resultError}`}>
            {provisionResult.message}
          </div>
        )}
      </div>

      {/* Card: Chọn nodes */}
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>
          <Radio size={18} /> Chọn Sensor Nodes
          <span className={styles.selectedCount}>
            ({selectedNodeIds.length}/{nodes.length} đã chọn)
          </span>
        </h2>

        <div className={styles.nodeActions}>
          <button className={styles.linkBtn} onClick={selectAll}>Chọn tất cả</button>
          <button className={styles.linkBtn} onClick={selectNone}>Bỏ chọn tất cả</button>
        </div>

        {loading ? (
          <div className={styles.progress}>
            <div className={styles.spinner} />
            <span>Đang tải danh sách nodes...</span>
          </div>
        ) : (
          <div className={styles.nodeGrid}>
            {nodes.map(node => (
              <label
                key={node.id}
                className={`${styles.nodeChip} ${selectedNodeIds.includes(node.id) ? styles.nodeChipSelected : ''}`}
              >
                <input
                  type="checkbox"
                  checked={selectedNodeIds.includes(node.id)}
                  onChange={() => toggleNode(node.id)}
                />
                <span>{node.name}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Card: Backfill */}
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>
          <Database size={18} /> Backfill dữ liệu lịch sử
        </h2>

        <form onSubmit={handleBackfill} className={styles.form}>
          <div className={styles.rowFields3}>
            <div>
              <label className={styles.fieldLabel}>
                <Clock size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                Từ ngày
              </label>
              <input
                type="datetime-local"
                className={styles.fieldInput}
                value={form.from}
                onChange={(e) => setForm({ ...form, from: e.target.value })}
                required
              />
            </div>
            <div>
              <label className={styles.fieldLabel}>
                <Clock size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                Đến ngày
              </label>
              <input
                type="datetime-local"
                className={styles.fieldInput}
                value={form.to}
                onChange={(e) => setForm({ ...form, to: e.target.value })}
                required
              />
            </div>
            <div>
              <label className={styles.fieldLabel}>Interval (phút)</label>
              <input
                type="number"
                className={styles.fieldInput}
                value={form.intervalMinutes}
                onChange={(e) => setForm({ ...form, intervalMinutes: e.target.value })}
                min="1"
                max="1440"
                required
              />
            </div>
          </div>

          <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)', margin: 0 }}>
            Ước tính: <strong>{estimateRecords().toLocaleString()}</strong> bản ghi sẽ được tạo
          </p>

          <div className={styles.formActions}>
            <Button type="submit" loading={running} disabled={running || selectedNodeIds.length === 0}>
              <FlaskConical size={16} />
              {running ? 'Đang chạy...' : 'Chạy Backfill'}
            </Button>
          </div>
        </form>

        {running && (
          <div className={styles.progress}>
            <div className={styles.spinner} />
            <span>Đang ghi dữ liệu vào database... Vui lòng chờ.</span>
          </div>
        )}

        {result && (
          <div className={`${styles.result} ${result.type === 'success' ? styles.resultSuccess : styles.resultError}`}>
            {result.message}
          </div>
        )}
      </div>

      {/* Card: Realtime */}
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>
          <Play size={18} /> Realtime Simulation
        </h2>

        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', margin: '0 0 var(--space-4) 0' }}>
          Phát dữ liệu liên tục giống sensor thật. Data được ghi vào DB và broadcast qua Socket.IO.
        </p>

        <div className={styles.rowFields}>
          <div>
            <label className={styles.fieldLabel}>Interval (giây)</label>
            <input
              type="number"
              className={styles.fieldInput}
              value={rtInterval}
              onChange={(e) => setRtInterval(e.target.value)}
              min="1"
              max="300"
              disabled={rtStatus.running}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            {rtStatus.running ? (
              <Button variant="danger" onClick={handleStopRealtime}>
                <Square size={16} /> Dừng
              </Button>
            ) : (
              <Button onClick={handleStartRealtime} loading={rtStarting} disabled={rtStarting || selectedNodeIds.length === 0}>
                <Play size={16} /> Bắt đầu
              </Button>
            )}
          </div>
        </div>

        {rtStatus.running && (
          <div className={`${styles.result} ${styles.resultSuccess}`} style={{ marginTop: 'var(--space-4)' }}>
            <div className={styles.rtLive}>
              <span className={styles.liveDot} />
              <strong>ĐANG CHẠY</strong>
            </div>
            <div style={{ marginTop: 'var(--space-2)', fontSize: 'var(--font-size-xs)' }}>
              {rtStatus.nodeCount} nodes · mỗi {rtStatus.intervalSeconds}s · đã gửi <strong>{rtStatus.tickCount}</strong> ticks
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
