import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { FlaskConical, Database, Clock, Radio, Play, Square } from 'lucide-react';
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

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>{t('admin.simulator')}</h1>
          <p className={styles.subtitle}>Sinh dữ liệu giả lập cho các sensor node để test giao diện</p>
        </div>
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
