import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Radio, Plus, Pencil, Trash2, Battery, Signal } from 'lucide-react';
import { deviceService } from '@/services/deviceService';
import DataTable from '@/components/ui/DataTable/DataTable';
import Button from '@/components/ui/Button/Button';
import Badge from '@/components/ui/Badge/Badge';
import Modal from '@/components/ui/Modal/Modal';
import Input from '@/components/ui/Input/Input';
import Select from '@/components/ui/Select/Select';
import { formatDateTime, formatBattery, formatRSSI, getBatteryStatus } from '@/utils/formatters';
import toast from 'react-hot-toast';
import styles from './SensorNodes.module.css';

export default function SensorNodes() {
  const { t } = useTranslation();
  const [nodes, setNodes] = useState([]);
  const [gateways, setGateways] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);
  const [form, setForm] = useState({ node_id: '', name: '', gateway_id: '', location_desc: '', lat: '', lng: '' });
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [nodesData, gwData] = await Promise.all([
        deviceService.getNodes(),
        deviceService.getGateways(),
      ]);
      setNodes(nodesData.data || []);
      setGateways(gwData.data || []);
    } catch (err) {
      toast.error('Không thể tải danh sách sensor nodes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openCreate = () => {
    setEditItem(null);
    setForm({ node_id: '', name: '', gateway_id: '', location_desc: '', lat: '', lng: '' });
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    setForm({
      node_id: item.node_id || '',
      name: item.name || '',
      gateway_id: item.gateway_id || '',
      location_desc: item.location_desc || '',
      lat: item.lat || '',
      lng: item.lng || '',
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        lat: form.lat ? parseFloat(form.lat) : null,
        lng: form.lng ? parseFloat(form.lng) : null,
      };
      if (editItem) {
        await deviceService.updateNode(editItem.node_id, payload);
        toast.success('Cập nhật sensor node thành công');
      } else {
        await deviceService.createNode(payload);
        toast.success('Thêm sensor node thành công');
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
      await deviceService.deleteNode(deleteItem.node_id);
      toast.success('Xóa sensor node thành công');
      setDeleteItem(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Không thể xóa node');
    }
  };

  const batteryColor = (level) => {
    const status = getBatteryStatus(level);
    if (status === 'critical' || status === 'low') return '#EF4444';
    if (status === 'medium') return '#F59E0B';
    return '#22C55E';
  };

  const columns = [
    { key: 'node_id', label: 'ID', sortable: true, width: '130px' },
    { key: 'name', label: 'Tên', sortable: true },
    { key: 'gateway_id', label: 'Gateway', sortable: true, width: '130px' },
    {
      key: 'status', label: 'Trạng thái', sortable: true, width: '120px',
      render: (val) => (
        <Badge variant={val === 'active' ? 'success' : 'default'} dot pulse={val === 'active'}>
          {val === 'active' ? 'Online' : 'Offline'}
        </Badge>
      ),
    },
    {
      key: 'battery_level', label: 'Pin', sortable: true, width: '100px',
      render: (val) => (
        <div className={styles.batteryCell}>
          <div className={styles.batteryBar}>
            <div className={styles.batteryFill} style={{ width: `${val || 0}%`, background: batteryColor(val) }} />
          </div>
          <span>{formatBattery(val)}</span>
        </div>
      ),
    },
    {
      key: 'lora_rssi', label: 'RSSI', width: '100px',
      render: (val) => formatRSSI(val),
    },
    {
      key: 'last_seen', label: 'Lần cuối', width: '160px',
      render: (val) => formatDateTime(val),
    },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>{t('admin.nodes')}</h1>
          <p className={styles.subtitle}>Quản lý các sensor node cảm biến</p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={nodes}
        loading={loading}
        searchPlaceholder="Tìm sensor node..."
        searchKeys={['node_id', 'name', 'gateway_id']}
        emptyTitle="Chưa có sensor node nào"
        emptyIcon={Radio}
        toolbar={
          <Button size="sm" onClick={openCreate}>
            <Plus size={16} /> Thêm Node
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
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? 'Sửa Sensor Node' : 'Thêm Sensor Node'}>
        <form onSubmit={handleSave} className={styles.form}>
          <Input
            id="node_id" label="Node ID" placeholder="NODE_001"
            value={form.node_id} onChange={(e) => setForm({ ...form, node_id: e.target.value })}
            required disabled={!!editItem}
          />
          <Input
            id="name" label="Tên node" placeholder="Node Sân trường"
            value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <Select
            id="gateway_id" label="Gateway"
            value={form.gateway_id}
            onChange={(e) => setForm({ ...form, gateway_id: e.target.value })}
            placeholder="Chọn gateway..."
            options={gateways.map((gw) => ({ value: gw.gateway_id, label: `${gw.gateway_id} — ${gw.name}` }))}
            required
          />
          <Input
            id="location_desc" label="Mô tả vị trí"
            value={form.location_desc} onChange={(e) => setForm({ ...form, location_desc: e.target.value })}
          />
          <div className={styles.rowFields}>
            <Input
              id="lat" label="Vĩ độ (lat)" placeholder="10.7733" type="number" step="any"
              value={form.lat} onChange={(e) => setForm({ ...form, lat: e.target.value })}
            />
            <Input
              id="lng" label="Kinh độ (lng)" placeholder="106.6575" type="number" step="any"
              value={form.lng} onChange={(e) => setForm({ ...form, lng: e.target.value })}
            />
          </div>
          <div className={styles.formActions}>
            <Button variant="ghost" type="button" onClick={() => setModalOpen(false)}>Hủy</Button>
            <Button type="submit" loading={saving}>{editItem ? 'Cập nhật' : 'Thêm mới'}</Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm */}
      <Modal isOpen={!!deleteItem} onClose={() => setDeleteItem(null)} title="Xác nhận xóa">
        <p className={styles.deleteMsg}>
          Bạn có chắc muốn xóa node <strong>{deleteItem?.name}</strong>?
          Tất cả dữ liệu đo lường liên quan sẽ bị xóa.
        </p>
        <div className={styles.formActions}>
          <Button variant="ghost" onClick={() => setDeleteItem(null)}>Hủy</Button>
          <Button variant="danger" onClick={handleDelete}>Xóa</Button>
        </div>
      </Modal>
    </div>
  );
}
