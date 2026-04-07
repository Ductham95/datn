import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import styles from './NotFound.module.css';

export default function NotFound() {
  const { t } = useTranslation();

  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <span className={styles.emoji}>🌫️</span>
        <h1 className={styles.code}>{t('notFound.title')}</h1>
        <h2 className={styles.message}>{t('notFound.message')}</h2>
        <p className={styles.description}>{t('notFound.description')}</p>
        <Link to="/" className={styles.homeLink}>
          ← {t('notFound.goHome')}
        </Link>
      </div>
    </div>
  );
}
