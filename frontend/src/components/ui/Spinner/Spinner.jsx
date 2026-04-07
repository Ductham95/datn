import styles from './Spinner.module.css';

export function Spinner({ size = 24, color, className = '' }) {
  return (
    <div
      className={`${styles.spinner} ${className}`}
      style={{
        width: size,
        height: size,
        borderColor: color || undefined,
      }}
    />
  );
}

export function Skeleton({ width, height = 20, radius = 'md', className = '' }) {
  return (
    <div
      className={`${styles.skeleton} ${className}`}
      style={{
        width: width || '100%',
        height,
        borderRadius: `var(--radius-${radius})`,
      }}
    />
  );
}

export function PageLoader() {
  return (
    <div className={styles.pageLoader}>
      <Spinner size={36} />
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className={styles.cardSkeleton}>
      <Skeleton height={14} width="40%" />
      <Skeleton height={32} width="60%" />
      <Skeleton height={12} width="80%" />
    </div>
  );
}
