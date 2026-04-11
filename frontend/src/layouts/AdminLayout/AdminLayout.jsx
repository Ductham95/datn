import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard, Router, Radio, AlertTriangle,
  Settings, Users, ClipboardList, Download, LogOut, Globe, Activity
} from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';
import styles from './AdminLayout.module.css';

const navItems = [
  { path: '/admin',         icon: LayoutDashboard, labelKey: 'admin.dashboard', end: true },
  { path: '/admin/gateways', icon: Router,         labelKey: 'admin.gateways' },
  { path: '/admin/nodes',    icon: Radio,           labelKey: 'admin.nodes' },
  { path: '/admin/alerts',   icon: AlertTriangle,   labelKey: 'admin.alerts' },
  { path: '/admin/config',   icon: Settings,        labelKey: 'admin.config' },
  { path: '/admin/users',    icon: Users,           labelKey: 'admin.users' },
  { path: '/admin/logs',     icon: ClipboardList,   labelKey: 'admin.logs' },
  { path: '/admin/export',   icon: Download,        labelKey: 'admin.export' },
  { path: '/admin/telemetry-logs', icon: Activity,  labelKey: 'admin.telemetryLogs' },
];

export default function AdminLayout() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const toggleLang = () => {
    i18n.changeLanguage(i18n.language === 'vi' ? 'en' : 'vi');
  };

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <span className={styles.logo}>⚙️</span>
          <span className={styles.brandName}>Admin Panel</span>
        </div>

        <nav className={styles.nav}>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) =>
                `${styles.navItem} ${isActive ? styles.active : ''}`
              }
            >
              <item.icon size={18} />
              <span>{t(item.labelKey)}</span>
            </NavLink>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <button className={styles.langBtn} onClick={toggleLang}>
            <Globe size={16} />
            <span>{i18n.language.toUpperCase()}</span>
          </button>
          <button className={styles.logoutBtn} onClick={handleLogout}>
            <LogOut size={16} />
            <span>{t('admin.logout')}</span>
          </button>
        </div>
      </aside>

      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}
