import { useState, useEffect, useRef } from 'react';
import styles from './MetricCard.module.css';

export default function MetricCard({
  label,
  value,
  unit,
  icon: Icon,
  color,
  bgColor,
  trend,
  animate = true,
}) {
  const [displayValue, setDisplayValue] = useState(animate ? 0 : value);
  const animatedRef = useRef(false);

  useEffect(() => {
    if (!animate || animatedRef.current || value == null || isNaN(value)) {
      setDisplayValue(value);
      return;
    }

    animatedRef.current = true;
    const duration = 800;
    const startTime = performance.now();
    const numValue = Number(value);

    function step(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = numValue * eased;

      setDisplayValue(Number.isInteger(numValue) ? Math.round(current) : parseFloat(current.toFixed(1)));

      if (progress < 1) {
        requestAnimationFrame(step);
      }
    }

    requestAnimationFrame(step);
  }, [value, animate]);

  return (
    <div className={styles.card} style={{ '--metric-color': color, '--metric-bg': bgColor }}>
      <div className={styles.top}>
        {Icon && (
          <div className={styles.iconBox}>
            <Icon size={20} />
          </div>
        )}
        {trend != null && (
          <span className={`${styles.trend} ${trend >= 0 ? styles.trendUp : styles.trendDown}`}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div className={styles.valueRow}>
        <span className={styles.value}>{displayValue ?? '--'}</span>
        {unit && <span className={styles.unit}>{unit}</span>}
      </div>
      <span className={styles.label}>{label}</span>
    </div>
  );
}
