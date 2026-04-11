import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ClipboardList } from 'lucide-react';
import { logService } from '@/services/adminService';
import DataTable from '@/components/ui/DataTable/DataTable';
import Badge from '@/components/ui/Badge/Badge';
import { formatDateTime } from '@/utils/formatters';
import toast from 'react-hot-toast';
import styles from './AuditLogs.module.css';

const ACTION_COLORS = {
  CREATE: 'success',
  UPDATE: 'warning',
  DELETE: 'danger',
  LOGIN: 'primary',
};

export default function AuditLogs() {
  const { t } = useTranslation();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const data = await logService.getLogs();
      setLogs(data.logs || []);
    } catch (err) {
      toast.error('Không thể tải nhật ký');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const columns = [
    {
      key: 'created_at', label: 'Thời gian', sortable: true, width: '170px',
      render: (val) => formatDateTime(val),
    },
    { key: 'username', label: 'Người dùng', sortable: true, width: '130px' },
    {
      key: 'action', label: 'Hành động', sortable: true, width: '120px',
      render: (val) => (
        <Badge variant={ACTION_COLORS[val] || 'default'}>{val}</Badge>
      ),
    },
    { key: 'resource', label: 'Đối tượng', sortable: true, width: '130px' },
    { key: 'resource_id', label: 'ID', width: '120px' },
    {
      key: 'details', label: 'Chi tiết',
      render: (val) => (
        <span className={styles.details}>
          {typeof val === 'object' ? JSON.stringify(val) : (val || '--')}
        </span>
      ),
    },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>{t('admin.logs')}</h1>
          <p className={styles.subtitle}>Nhật ký hoạt động quản trị (chỉ đọc)</p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={logs}
        loading={loading}
        searchPlaceholder="Tìm trong nhật ký..."
        searchKeys={['username', 'action', 'resource', 'resource_id']}
        emptyTitle="Chưa có nhật ký nào"
        emptyIcon={ClipboardList}
        pageSize={15}
      />
    </div>
  );
}
