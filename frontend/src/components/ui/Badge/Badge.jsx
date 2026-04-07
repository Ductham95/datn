import styles from './Badge.module.css';

export default function Badge({
  children,
  variant = 'default',
  size = 'md',
  dot = false,
  pulse = false,
  color,
  bgColor,
  className = '',
}) {
  const classes = [
    styles.badge,
    styles[variant],
    styles[size],
    pulse && styles.pulse,
    className,
  ].filter(Boolean).join(' ');

  const customStyle = {};
  if (color) customStyle.color = color;
  if (bgColor) customStyle.backgroundColor = bgColor;

  return (
    <span className={classes} style={customStyle}>
      {dot && <span className={styles.dot} />}
      {children}
    </span>
  );
}
