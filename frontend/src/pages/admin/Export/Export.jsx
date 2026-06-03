import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Download, Calendar, Database, FileSpreadsheet } from 'lucide-react';
import { exportService } from '@/services/adminService';
import { deviceService } from '@/services/deviceService';
import Card from '@/components/ui/Card/Card';
import Button from '@/components/ui/Button/Button';
import Input from '@/components/ui/Input/Input';
import Select from '@/components/ui/Select/Select';
import toast from 'react-hot-toast';
import styles from './Export.module.css';

export default function Export() {
  const { t } = useTranslation();
  const [nodes, setNodes] = useState([]);
  const [form, setForm] = useState({ node_id: '', from: '', to: '' });
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const fetchNodes = async () => {
      try {
        const data = await deviceService.getNodes();
        setNodes(data.data || []);
      } catch (err) {
        console.error('Failed to fetch nodes:', err);
      }
    };
    fetchNodes();
  }, []);

  const handleExport = async () => {
    if (!form.node_id) {
      toast.error('Vui lòng chọn sensor node');
      return;
    }
    setExporting(true);
    try {
      await exportService.exportMeasurements(form);
      toast.success('Tải file CSV thành công!');
    } catch (err) {
      toast.error('Không thể xuất dữ liệu');
    } finally {
      setExporting(false);
    }
  };

  // Set default date range (last 7 days)
  useEffect(() => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    setForm((prev) => ({
      ...prev,
      from: weekAgo.toISOString().split('T')[0],
      to: now.toISOString().split('T')[0],
    }));
  }, []);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>{t('admin.export')}</h1>
          <p className={styles.subtitle}>Xuất dữ liệu đo lường ra file CSV</p>
        </div>
      </div>

      <Card padding="lg" className={styles.card}>
        <div className={styles.form}>
          <Select
            id="node_id" label="Sensor Node"
            value={form.node_id}
            onChange={(e) => setForm({ ...form, node_id: e.target.value })}
            placeholder="Chọn node..."
            options={nodes.map((n) => ({ value: n.id, label: `${n.id} — ${n.name}` }))}
            icon={Database}
          />

          <div className={styles.dateRow}>
            <Input
              id="from" label="Từ ngày" type="date"
              value={form.from}
              onChange={(e) => setForm({ ...form, from: e.target.value })}
              icon={Calendar}
            />
            <Input
              id="to" label="Đến ngày" type="date"
              value={form.to}
              onChange={(e) => setForm({ ...form, to: e.target.value })}
              icon={Calendar}
            />
          </div>

          <div className={styles.preview}>
            <FileSpreadsheet size={20} className={styles.previewIcon} />
            <div>
              <p className={styles.previewLabel}>File xuất sẽ chứa:</p>
              <p className={styles.previewDesc}>
                Dữ liệu PM2.5, PM10, CO₂, TVOC, nhiệt độ, độ ẩm
                {form.from && form.to && (
                  <> từ <strong>{form.from}</strong> đến <strong>{form.to}</strong></>
                )}
              </p>
            </div>
          </div>

          <Button size="lg" onClick={handleExport} loading={exporting} fullWidth>
            <Download size={18} /> Tải xuống CSV
          </Button>
        </div>
      </Card>
    </div>
  );
}
