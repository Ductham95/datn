import { getAQILevel, getAQILabel, getAQIEmoji } from '@/utils/aqi';
import styles from './AQIBadge.module.css';

export default function AQIBadge({ value, size = 'md', showLabel = true, showEmoji = false, lang = 'vi' }) {
  const level = getAQILevel(value);
  const label = getAQILabel(value, lang);
  const emoji = getAQIEmoji(value);

  return (
    <div
      className={`${styles.badge} ${styles[size]}`}
      style={{ '--aqi-color': level.color, '--aqi-bg': level.bg }}
    >
      <span className={styles.value}>{value ?? '--'}</span>
      {showLabel && <span className={styles.label}>{label}</span>}
      {showEmoji && <span className={styles.emoji}>{emoji}</span>}
    </div>
  );
}
