import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Check, Trash2, Filter } from 'lucide-react';
import { alertService } from '@/services/adminService';
import { deviceService } from '@/services/deviceService';
import DataTable from '@/components/ui/DataTable/DataTable';
import Button from '@/components/ui/Button/Button';
import Badge from '@/components/ui/Badge/Badge';
import Modal from '@/components/ui/Modal/Modal';
import Select from '@/components/ui/Select/Select';
import { formatDateTime } from '@/utils/formatters';
import toast from 'react-hot-toast';
import styles from './Alerts.module.css';

const SEVERITY_MAP = {
  warn: { variant: 'warning', label: 'Cảnh báo' },
  warning: { variant: 'warning', label: 'Cảnh báo' },
  danger: { variant: 'danger', label: 'Nguy hiểm' },
  critical: { variant: 'danger', label: 'Nghiêm trọng' },
};

export default function Alerts() {
  const { t } = useTranslation();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteItem, setDeleteItem] = useState(null);
  const [filterSeverity, setFilterSeverity] = useState('');
  const [filterNodeId, setFilterNodeId] = useState('');
  const [gateways, setGateways] = useState([]);
  const [nodes, setNodes] = useState([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const PAGE_SIZE = 10;

  // Fetch device lists for filter dropdowns
  useEffect(() => {
    Promise.all([
      deviceService.getGateways().then(res => setGateways(res.gateways || res.data || [])),
      deviceService.getNodes().then(res => setNodes(res.nodes || res.data || [])),
    ]).catch(() => {});
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const params = { page, limit: PAGE_SIZE };
      if (filterSeverity) params.severity = filterSeverity;
      if (filterNodeId) params.node_id = filterNodeId;
      const data = await alertService.getAlerts(params);
      setAlerts(data.alerts || []);
      if (data.pagination) setPagination(data.pagination);
    } catch (err) {
      toast.error('Không thể tải danh sách cảnh báo');
    } finally {
      setLoading(false);
    }
  }, [filterSeverity, filterNodeId, page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAcknowledge = async (id) => {
    try {
      await alertService.acknowledgeAlert(id);
      toast.success('Đã xác nhận cảnh báo');
      fetchData();
    } catch (err) {
      toast.error('Không thể xác nhận cảnh báo');
    }
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    try {
      await alertService.deleteAlert(deleteItem.id);
      toast.success('Đã xóa cảnh báo');
      setDeleteItem(null);
      fetchData();
    } catch (err) {
      toast.error('Không thể xóa cảnh báo');
    }
  };

  const columns = [
    {
      key: 'created_at', label: 'Thời gian', sortable: true, width: '160px',
      render: (val) => formatDateTime(val),
    },
    { key: 'node_id', label: 'Node', sortable: true, width: '120px' },
    { key: 'message', label: 'Nội dung', width: 'auto' },
    {
      key: 'severity', label: 'Mức độ', sortable: true, width: '120px',
      render: (val) => {
        const info = SEVERITY_MAP[val] || { variant: 'default', label: val };
        return <Badge variant={info.variant}>{info.label}</Badge>;
      },
    },
    {
      key: 'acknowledged', label: 'Xác nhận', width: '100px',
      render: (val) => (
        <Badge variant={val ? 'success' : 'default'}>
          {val ? '✓ Đã xác nhận' : 'Chưa'}
        </Badge>
      ),
    },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>{t('admin.alerts')}</h1>
          <p className={styles.subtitle}>Danh sách cảnh báo chất lượng không khí</p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={alerts}
        loading={loading}
        searchPlaceholder="Tìm cảnh báo..."
        searchKeys={['node_id', 'message', 'severity']}
        emptyTitle="Không có cảnh báo nào"
        emptyDescription="Hệ thống đang hoạt động bình thường"
        emptyIcon={AlertTriangle}
        toolbar={
          <>
            <Select
              value={filterNodeId}
              onChange={(e) => { setFilterNodeId(e.target.value); setPage(1); }}
              placeholder="Tất cả thiết bị"
              options={[
                ...gateways.map(g => ({ value: g.id, label: `📡 ${g.name}` })),
                ...nodes.map(n => ({ value: n.id, label: `📟 ${n.name}` })),
              ]}
            />
            <Select
              value={filterSeverity}
              onChange={(e) => { setFilterSeverity(e.target.value); setPage(1); }}
              placeholder="Tất cả mức độ"
              options={[
                { value: 'warn', label: '⚠️ Cảnh báo' },
                { value: 'danger', label: '🔴 Nguy hiểm' },
              ]}
            />
          </>
        }
        serverPagination={{
          page,
          totalPages: pagination.totalPages,
          total: pagination.total,
          onPageChange: setPage,
        }}
        actions={(row) => (
          <>
            {!row.acknowledged && (
              <button className={styles.actionBtn} onClick={(e) => { e.stopPropagation(); handleAcknowledge(row.id); }} title="Xác nhận">
                <Check size={15} />
              </button>
            )}
            <button className={`${styles.actionBtn} ${styles.dangerBtn}`} onClick={(e) => { e.stopPropagation(); setDeleteItem(row); }} title="Xóa">
              <Trash2 size={15} />
            </button>
          </>
        )}
      />

      <Modal isOpen={!!deleteItem} onClose={() => setDeleteItem(null)} title="Xác nhận xóa">
        <p className={styles.deleteMsg}>Bạn có chắc muốn xóa cảnh báo này?</p>
        <div className={styles.formActions}>
          <Button variant="ghost" onClick={() => setDeleteItem(null)}>Hủy</Button>
          <Button variant="danger" onClick={handleDelete}>Xóa</Button>
        </div>
      </Modal>
    </div>
  );
}
