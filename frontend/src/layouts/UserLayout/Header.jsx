import { useTranslation } from 'react-i18next';
import { Menu, Wifi, WifiOff, Globe } from 'lucide-react';
import styles from './Header.module.css';

export default function Header({ onMenuToggle, isConnected }) {
  const { t, i18n } = useTranslation();

  const toggleLang = () => {
    const newLang = i18n.language === 'vi' ? 'en' : 'vi';
    i18n.changeLanguage(newLang);
  };

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <button className={styles.menuButton} onClick={onMenuToggle}>
          <Menu size={20} />
        </button>
        <div className={styles.brand}>
          <span className={styles.logo}>🌍</span>
          <div className={styles.brandText}>
            <span className={styles.brandName}>{t('app.name')}</span>
            <span className={styles.brandSub}>Monitor</span>
          </div>
        </div>
      </div>

      <div className={styles.right}>
        {/* Connection status */}
        <div className={`${styles.statusBadge} ${isConnected ? styles.online : styles.offline}`}>
          {isConnected ? <Wifi size={14} /> : <WifiOff size={14} />}
          <span>{isConnected ? 'Live' : 'Offline'}</span>
        </div>

        {/* Language toggle */}
        <button className={styles.langButton} onClick={toggleLang} title="Switch language">
          <Globe size={16} />
          <span>{i18n.language.toUpperCase()}</span>
        </button>
      </div>
    </header>
  );
}
