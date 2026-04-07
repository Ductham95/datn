import { useTranslation } from 'react-i18next';
import { ShieldAlert, ShieldCheck, Heart } from 'lucide-react';
import { getAQILevel, getWHOComparison } from '@/utils/aqi';
import Card from '@/components/ui/Card/Card';
import styles from './HealthAdvice.module.css';

export default function HealthAdvice({ aqi, pm25, lang = 'vi' }) {
  const { t } = useTranslation();
  const level = getAQILevel(aqi);
  const whoComp = getWHOComparison(pm25);

  return (
    <Card title={t('dashboard.healthTitle')} icon={Heart} padding="md">
      <div className={styles.content}>
        {/* WHO comparison */}
        {whoComp ? (
          <div className={styles.whoWarning}>
            <ShieldAlert size={18} />
            <span>{t('health.whoWarning', { times: whoComp.times })}</span>
          </div>
        ) : (
          <div className={styles.whoSafe}>
            <ShieldCheck size={18} />
            <span>{t('health.whoSafe')}</span>
          </div>
        )}

        {/* Health advice based on AQI level */}
        <p className={styles.advice}>
          {t(`health.advice.${level.level}`)}
        </p>
      </div>
    </Card>
  );
}
