import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LayoutDashboard, Map, BarChart3, Trophy, Settings } from 'lucide-react';
import styles from './Sidebar.module.css';

const navItems = [
  { path: '/',         icon: LayoutDashboard, labelKey: 'nav.dashboard' },
  { path: '/map',      icon: Map,             labelKey: 'nav.map' },
  { path: '/history',  icon: BarChart3,        labelKey: 'nav.history' },
  { path: '/ranking',  icon: Trophy,          labelKey: 'nav.ranking' },
];

export default function Sidebar({ isOpen, onClose }) {
  const { t } = useTranslation();

  return (
    <aside className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}>
      <nav className={styles.nav}>
        <div className={styles.navGroup}>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `${styles.navItem} ${isActive ? styles.active : ''}`
              }
              onClick={onClose}
            >
              <item.icon size={18} />
              <span>{t(item.labelKey)}</span>
            </NavLink>
          ))}
        </div>

        <div className={styles.navDivider} />

        <div className={styles.navGroup}>
          <NavLink
            to="/admin"
            className={styles.navItem}
            onClick={onClose}
          >
            <Settings size={18} />
            <span>{t('nav.admin')}</span>
          </NavLink>
        </div>
      </nav>

      <div className={styles.footer}>
        <div className={styles.footerBrand}>
          <span className={styles.footerLogo}>🌱</span>
          <span className={styles.footerText}>AirQuality v1.0</span>
        </div>
      </div>
    </aside>
  );
}
