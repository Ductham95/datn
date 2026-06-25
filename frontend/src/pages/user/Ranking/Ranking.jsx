import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Trophy } from 'lucide-react';
import { stationService } from '@/services/stationService';
import AQIBadge from '@/components/common/AQIBadge/AQIBadge';
import Badge from '@/components/ui/Badge/Badge';
import { PageLoader } from '@/components/ui/Spinner/Spinner';
import { formatNumber } from '@/utils/formatters';
import { REFRESH_INTERVALS } from '@/utils/constants';
import styles from './Ranking.module.css';

export default function Ranking() {
  const { t, i18n } = useTranslation();
  const [ranking, setRanking] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRanking = async () => {
      try {
        const data = await stationService.getRanking();
        setRanking(data.data || []);
      } catch (err) {
        console.error('Ranking fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchRanking();
    const interval = setInterval(fetchRanking, REFRESH_INTERVALS.RANKING);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <PageLoader />;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>{t('ranking.title')}</h1>
          <p className={styles.subtitle}>{t('ranking.subtitle')}</p>
        </div>
      </div>

      {ranking.length === 0 ? (
        <div className={styles.empty}>
          <Trophy size={48} strokeWidth={1} />
          <p>{t('ranking.noData')}</p>
        </div>
      ) : (
        <div className={styles.list}>
          {ranking.map((item, index) => (
            <div
              key={item.node_id}
              className={`${styles.rankItem} ${index < 3 ? styles.topThree : ''}`}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className={styles.rankNumber}>
                <span className={styles.rankDigit}>{item.rank || index + 1}</span>
              </div>
              <div className={styles.stationInfo}>
                <span className={styles.stationName}>{item.name}</span>
                <span className={styles.stationId}>{item.node_id}</span>
              </div>
              <div className={styles.metrics}>
                <div className={styles.metricItem}>
                  <span className={styles.metricLabel}>PM2.5</span>
                  <span className={styles.metricValue}>{formatNumber(item.pm25)}</span>
                </div>
                <div className={styles.metricItem}>
                  <span className={styles.metricLabel}>CO₂</span>
                  <span className={styles.metricValue}>{item.co2 ?? '--'}</span>
                </div>
              </div>
              <AQIBadge value={item.aqi} size="md" lang={i18n.language} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
