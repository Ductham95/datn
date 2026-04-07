import styles from './Card.module.css';

export default function Card({
  children,
  title,
  subtitle,
  icon: Icon,
  action,
  padding = 'md',
  hoverable = false,
  className = '',
  ...props
}) {
  const classes = [
    styles.card,
    styles[`padding-${padding}`],
    hoverable && styles.hoverable,
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={classes} {...props}>
      {(title || action) && (
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            {Icon && (
              <div className={styles.iconWrapper}>
                <Icon size={18} />
              </div>
            )}
            <div>
              {title && <h3 className={styles.title}>{title}</h3>}
              {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
            </div>
          </div>
          {action && <div className={styles.action}>{action}</div>}
        </div>
      )}
      <div className={styles.body}>{children}</div>
    </div>
  );
}
