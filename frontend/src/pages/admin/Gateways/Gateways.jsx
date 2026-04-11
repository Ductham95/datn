import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Router, Plus, Pencil, Trash2, Wifi, WifiOff } from 'lucide-react';
import { deviceService } from '@/services/deviceService';
import DataTable from '@/components/ui/DataTable/DataTable';
import Button from '@/components/ui/Button/Button';
import Badge from '@/components/ui/Badge/Badge';
import Modal from '@/components/ui/Modal/Modal';
import Input from '@/components/ui/Input/Input';
import { formatDateTime } from '@/utils/formatters';
import toast from 'react-hot-toast';
import styles from './Gateways.module.css';

export default function Gateways() {
  const { t } = useTranslation();
  const [gateways, setGateways] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);
  const [form, setForm] = useState({ name: '', location_desc: '', ip_address: '' });
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const data = await deviceService.getGateways();
      setGateways(data.data || []);
    } catch (err) {
      toast.error('Không thể tải danh sách gateways');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openCreate = () => {
    setEditItem(null);
    setForm({ name: '', location_desc: '', ip_address: '' });
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    setForm({
      name: item.name || '',
      location_desc: item.location_desc || '',
      ip_address: item.ip_address || '',
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editItem) {
        await deviceService.updateGateway(editItem.id, form);
        toast.success('Cập nhật gateway thành công');
      } else {
        await deviceService.createGateway(form);
        toast.success('Thêm gateway thành công');
      }
      setModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Thao tác thất bại');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    try {
      await deviceService.deleteGateway(deleteItem.id);
      toast.success('Xóa gateway thành công');
      setDeleteItem(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Không thể xóa gateway');
    }
  };

  const columns = [
    { key: 'id', label: 'ID', sortable: true, width: '140px' },
    { key: 'name', label: 'Tên', sortable: true },
    { key: 'location_desc', label: 'Vị trí', sortable: true },
    { key: 'ip_address', label: 'IP', sortable: true, width: '140px' },
    {
      key: 'status', label: 'Trạng thái', sortable: true, width: '130px',
      render: (val) => (
        <Badge variant={val === 'online' ? 'success' : 'default'} dot pulse={val === 'online'}>
          {val === 'online' ? 'Online' : 'Offline'}
        </Badge>
      ),
    },
    {
      key: 'last_seen', label: 'Hoạt động lần cuối', width: '170px',
      render: (val) => formatDateTime(val),
    },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>{t('admin.gateways')}</h1>
          <p className={styles.subtitle}>Quản lý các gateway thu thập dữ liệu</p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={gateways}
        loading={loading}
        searchPlaceholder="Tìm gateway..."
        searchKeys={['id', 'name', 'location_desc']}
        emptyTitle="Chưa có gateway nào"
        emptyIcon={Router}
        toolbar={
          <Button size="sm" onClick={openCreate}>
            <Plus size={16} /> Thêm Gateway
          </Button>
        }
        actions={(row) => (
          <>
            <button className={styles.actionBtn} onClick={(e) => { e.stopPropagation(); openEdit(row); }} title="Sửa">
              <Pencil size={15} />
            </button>
            <button className={`${styles.actionBtn} ${styles.dangerBtn}`} onClick={(e) => { e.stopPropagation(); setDeleteItem(row); }} title="Xóa">
              <Trash2 size={15} />
            </button>
          </>
        )}
      />

      {/* Create/Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? 'Sửa Gateway' : 'Thêm Gateway'}>
        <form onSubmit={handleSave} className={styles.form}>
          {editItem && (
            <Input
              id="gateway_id" label="Gateway ID"
              value={editItem.id}
              disabled
            />
          )}
          <Input
            id="name" label="Tên gateway" placeholder="Gateway Thư viện"
            value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <Input
            id="location_desc" label="Mô tả vị trí"
            value={form.location_desc} onChange={(e) => setForm({ ...form, location_desc: e.target.value })}
          />
          <Input
            id="ip_address" label="Địa chỉ IP" placeholder="192.168.1.100"
            value={form.ip_address} onChange={(e) => setForm({ ...form, ip_address: e.target.value })}
          />
          <div className={styles.formActions}>
            <Button variant="ghost" type="button" onClick={() => setModalOpen(false)}>Hủy</Button>
            <Button type="submit" loading={saving}>{editItem ? 'Cập nhật' : 'Thêm mới'}</Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm */}
      <Modal isOpen={!!deleteItem} onClose={() => setDeleteItem(null)} title="Xác nhận xóa">
        <p className={styles.deleteMsg}>
          Bạn có chắc muốn xóa gateway <strong>{deleteItem?.name}</strong>?
          Hành động này không thể hoàn tác.
        </p>
        <div className={styles.formActions}>
          <Button variant="ghost" onClick={() => setDeleteItem(null)}>Hủy</Button>
          <Button variant="danger" onClick={handleDelete}>Xóa</Button>
        </div>
      </Modal>
    </div>
  );
}
