import { useTranslation } from 'react-i18next';
import { LayoutDashboard, Router, Radio, AlertTriangle } from 'lucide-react';
import { useDashboard } from '@/hooks/useDashboard';
import MetricCard from '@/components/common/MetricCard/MetricCard';
import { PageLoader } from '@/components/ui/Spinner/Spinner';
import styles from './AdminDashboard.module.css';

export default function AdminDashboard() {
  const { t } = useTranslation();
  const { stations, loading } = useDashboard();

  if (loading) return <PageLoader />;

  const totalNodes = stations.length;
  const activeNodes = stations.filter((s) => s.status === 'active').length;
  const offlineNodes = totalNodes - activeNodes;

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>{t('admin.dashboard')}</h1>
      <p className={styles.subtitle}>{t('admin.title')}</p>

      <div className={styles.grid}>
        <MetricCard
          label="Total Sensor Nodes"
          value={totalNodes}
          icon={Radio}
          color="#6366F1"
          bgColor="#EEF2FF"
        />
        <MetricCard
          label={t('status.active')}
          value={activeNodes}
          icon={LayoutDashboard}
          color="#22C55E"
          bgColor="#F0FDF4"
        />
        <MetricCard
          label={t('status.offline')}
          value={offlineNodes}
          icon={AlertTriangle}
          color="#EF4444"
          bgColor="#FEF2F2"
        />
      </div>

      <div className={styles.placeholder}>
        <p>📊 Admin dashboard chi tiết sẽ được mở rộng sau.</p>
      </div>
    </div>
  );
}
