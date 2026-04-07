import styles from './Input.module.css';

export default function Input({
  label,
  error,
  icon: Icon,
  type = 'text',
  id,
  fullWidth = true,
  className = '',
  ...props
}) {
  return (
    <div className={`${styles.wrapper} ${fullWidth ? styles.fullWidth : ''} ${className}`}>
      {label && (
        <label htmlFor={id} className={styles.label}>
          {label}
        </label>
      )}
      <div className={`${styles.inputWrapper} ${error ? styles.hasError : ''}`}>
        {Icon && (
          <span className={styles.icon}>
            <Icon size={16} />
          </span>
        )}
        <input
          id={id}
          type={type}
          className={`${styles.input} ${Icon ? styles.hasIcon : ''}`}
          {...props}
        />
      </div>
      {error && <span className={styles.error}>{error}</span>}
    </div>
  );
}

export function Select({
  label,
  error,
  id,
  options = [],
  placeholder,
  fullWidth = true,
  className = '',
  ...props
}) {
  return (
    <div className={`${styles.wrapper} ${fullWidth ? styles.fullWidth : ''} ${className}`}>
      {label && (
        <label htmlFor={id} className={styles.label}>
          {label}
        </label>
      )}
      <div className={`${styles.inputWrapper} ${error ? styles.hasError : ''}`}>
        <select id={id} className={styles.select} {...props}>
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
      {error && <span className={styles.error}>{error}</span>}
    </div>
  );
}
