import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Users as UsersIcon, Plus, Pencil, Trash2, Shield, User } from 'lucide-react';
import { userService } from '@/services/adminService';
import DataTable from '@/components/ui/DataTable/DataTable';
import Button from '@/components/ui/Button/Button';
import Badge from '@/components/ui/Badge/Badge';
import Modal from '@/components/ui/Modal/Modal';
import Input from '@/components/ui/Input/Input';
import Select from '@/components/ui/Select/Select';
import { formatDateTime } from '@/utils/formatters';
import toast from 'react-hot-toast';
import styles from './Users.module.css';

export default function Users() {
  const { t } = useTranslation();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);
  const [form, setForm] = useState({ username: '', password: '', role: 'viewer' });
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const data = await userService.getUsers();
      setUsers(data.data || []);
    } catch (err) {
      toast.error('Không thể tải danh sách tài khoản');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openCreate = () => {
    setEditItem(null);
    setForm({ username: '', password: '', role: 'viewer' });
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    setForm({ username: item.username || '', password: '', role: item.role || 'viewer' });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editItem) {
        const payload = { role: form.role };
        if (form.password) payload.password = form.password;
        await userService.updateUser(editItem.id, payload);
        toast.success('Cập nhật tài khoản thành công');
      } else {
        await userService.createUser(form);
        toast.success('Thêm tài khoản thành công');
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
      await userService.deleteUser(deleteItem.id);
      toast.success('Xóa tài khoản thành công');
      setDeleteItem(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Không thể xóa tài khoản');
    }
  };

  const columns = [
    { key: 'id', label: 'ID', sortable: true, width: '60px' },
    { key: 'username', label: 'Tên đăng nhập', sortable: true },
    {
      key: 'role', label: 'Vai trò', sortable: true, width: '130px',
      render: (val) => (
        <Badge variant={val === 'admin' ? 'primary' : 'default'}>
          {val === 'admin' ? '🛡️ Admin' : '👤 Viewer'}
        </Badge>
      ),
    },
    {
      key: 'created_at', label: 'Ngày tạo', sortable: true, width: '160px',
      render: (val) => formatDateTime(val),
    },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>{t('admin.users')}</h1>
          <p className={styles.subtitle}>Quản lý tài khoản quản trị</p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={users}
        loading={loading}
        searchPlaceholder="Tìm tài khoản..."
        searchKeys={['username', 'role']}
        emptyTitle="Chưa có tài khoản nào"
        emptyIcon={UsersIcon}
        toolbar={
          <Button size="sm" onClick={openCreate}>
            <Plus size={16} /> Thêm tài khoản
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

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? 'Sửa tài khoản' : 'Thêm tài khoản'}>
        <form onSubmit={handleSave} className={styles.form}>
          <Input
            id="username" label="Tên đăng nhập" placeholder="admin"
            value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })}
            required disabled={!!editItem}
          />
          <Input
            id="password" label={editItem ? 'Mật khẩu mới (để trống nếu không đổi)' : 'Mật khẩu'}
            type="password" placeholder="••••••"
            value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
            required={!editItem}
          />
          <Select
            id="role" label="Vai trò"
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            options={[
              { value: 'admin', label: '🛡️ Admin' },
              { value: 'viewer', label: '👤 Viewer' },
            ]}
          />
          <div className={styles.formActions}>
            <Button variant="ghost" type="button" onClick={() => setModalOpen(false)}>Hủy</Button>
            <Button type="submit" loading={saving}>{editItem ? 'Cập nhật' : 'Thêm mới'}</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!deleteItem} onClose={() => setDeleteItem(null)} title="Xác nhận xóa">
        <p className={styles.deleteMsg}>
          Bạn có chắc muốn xóa tài khoản <strong>{deleteItem?.username}</strong>?
        </p>
        <div className={styles.formActions}>
          <Button variant="ghost" onClick={() => setDeleteItem(null)}>Hủy</Button>
          <Button variant="danger" onClick={handleDelete}>Xóa</Button>
        </div>
      </Modal>
    </div>
  );
}
