import { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';
import styles from './Select.module.css';

const Select = forwardRef(function Select(
  { id, label, options = [], placeholder, value, onChange, error, disabled, icon: Icon, className, ...props },
  ref
) {
  return (
    <div className={`${styles.wrapper} ${className || ''}`}>
      {label && <label htmlFor={id} className={styles.label}>{label}</label>}
      <div className={`${styles.inputBox} ${error ? styles.hasError : ''} ${disabled ? styles.disabled : ''}`}>
        {Icon && <Icon size={16} className={styles.icon} />}
        <select
          ref={ref}
          id={id}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={styles.select}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown size={16} className={styles.chevron} />
      </div>
      {error && <span className={styles.error}>{error}</span>}
    </div>
  );
});

export default Select;
