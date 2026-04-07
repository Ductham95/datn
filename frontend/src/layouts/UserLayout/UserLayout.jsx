import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import styles from './UserLayout.module.css';
import { useSocket } from '@/hooks/useSocket';

export default function UserLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isConnected } = useSocket();

  return (
    <div className={styles.layout}>
      <Header
        onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        isConnected={isConnected}
      />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className={styles.main}>
        <div className={styles.content}>
          <Outlet />
        </div>
      </main>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className={styles.overlay}
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
