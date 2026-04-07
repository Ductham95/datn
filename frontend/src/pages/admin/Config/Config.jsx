import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Settings, Save, RotateCcw } from 'lucide-react';
import { configService } from '@/services/adminService';
import Card from '@/components/ui/Card/Card';
import Input from '@/components/ui/Input/Input';
import Button from '@/components/ui/Button/Button';
import { PageLoader } from '@/components/ui/Spinner/Spinner';
import toast from 'react-hot-toast';
import styles from './Config.module.css';

const CONFIG_FIELDS = [
  { section: 'PM2.5', fields: [
    { key: 'pm25_warn', label: 'Ngưỡng cảnh báo PM2.5', unit: 'µg/m³', type: 'number' },
    { key: 'pm25_danger', label: 'Ngưỡng nguy hiểm PM2.5', unit: 'µg/m³', type: 'number' },
  ]},
  { section: 'PM10', fields: [
    { key: 'pm10_warn', label: 'Ngưỡng cảnh báo PM10', unit: 'µg/m³', type: 'number' },
    { key: 'pm10_danger', label: 'Ngưỡng nguy hiểm PM10', unit: 'µg/m³', type: 'number' },
  ]},
  { section: 'CO₂', fields: [
    { key: 'co2_warn', label: 'Ngưỡng cảnh báo CO₂', unit: 'ppm', type: 'number' },
    { key: 'co2_danger', label: 'Ngưỡng nguy hiểm CO₂', unit: 'ppm', type: 'number' },
  ]},
  { section: 'TVOC', fields: [
    { key: 'tvoc_warn', label: 'Ngưỡng cảnh báo TVOC', unit: 'ppb', type: 'number' },
    { key: 'tvoc_danger', label: 'Ngưỡng nguy hiểm TVOC', unit: 'ppb', type: 'number' },
  ]},
  { section: 'Nhiệt độ', fields: [
    { key: 'temp_min', label: 'Nhiệt độ tối thiểu', unit: '°C', type: 'number' },
    { key: 'temp_max', label: 'Nhiệt độ tối đa', unit: '°C', type: 'number' },
  ]},
  { section: 'Hệ thống', fields: [
    { key: 'sampling_interval', label: 'Khoảng cách lấy mẫu', unit: 'giây', type: 'number' },
  ]},
];

export default function Config() {
  const { t } = useTranslation();
  const [config, setConfig] = useState({});
  const [original, setOriginal] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const data = await configService.getConfig();
        const cfg = data.data || data || {};
        setConfig(cfg);
        setOriginal(cfg);
      } catch (err) {
        toast.error('Không thể tải cấu hình');
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, []);

  const handleChange = (key, value) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Validate warn < danger
      const errors = [];
      ['pm25', 'pm10', 'co2', 'tvoc'].forEach((metric) => {
        const warn = Number(config[`${metric}_warn`]);
        const danger = Number(config[`${metric}_danger`]);
        if (warn && danger && warn >= danger) {
          errors.push(`${metric.toUpperCase()}: ngưỡng cảnh báo phải nhỏ hơn ngưỡng nguy hiểm`);
        }
      });
      if (errors.length > 0) {
        errors.forEach((e) => toast.error(e));
        setSaving(false);
        return;
      }

      await configService.updateConfig(config);
      setOriginal(config);
      toast.success('Cập nhật cấu hình thành công');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Không thể cập nhật cấu hình');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setConfig(original);
    toast('Đã khôi phục giá trị ban đầu', { icon: '↩️' });
  };

  const hasChanges = JSON.stringify(config) !== JSON.stringify(original);

  if (loading) return <PageLoader />;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>{t('admin.config')}</h1>
          <p className={styles.subtitle}>Cấu hình ngưỡng cảnh báo và tham số hệ thống</p>
        </div>
        <div className={styles.headerActions}>
          <Button variant="ghost" onClick={handleReset} disabled={!hasChanges}>
            <RotateCcw size={16} /> Khôi phục
          </Button>
          <Button onClick={handleSave} loading={saving} disabled={!hasChanges}>
            <Save size={16} /> Lưu cấu hình
          </Button>
        </div>
      </div>

      <div className={styles.grid}>
        {CONFIG_FIELDS.map((section) => (
          <Card key={section.section} title={section.section} padding="md">
            <div className={styles.sectionFields}>
              {section.fields.map((field) => (
                <Input
                  key={field.key}
                  id={field.key}
                  label={field.label}
                  type={field.type}
                  value={config[field.key] ?? ''}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  placeholder={field.unit}
                />
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
