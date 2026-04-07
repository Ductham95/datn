import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Lock, User, AlertCircle } from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';
import Button from '@/components/ui/Button/Button';
import Input from '@/components/ui/Input/Input';
import styles from './Login.module.css';

export default function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login, isLoading, error, clearError } = useAuthStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await login(username, password);
    if (success) {
      navigate('/admin');
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <span className={styles.logo}>🌍</span>
          <h1 className={styles.title}>AirQuality Monitor</h1>
          <p className={styles.subtitle}>{t('admin.title')}</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {error && (
            <div className={styles.error}>
              <AlertCircle size={16} />
              <span>{t('admin.loginError')}</span>
            </div>
          )}

          <Input
            id="username"
            label={t('admin.username')}
            icon={User}
            placeholder="admin"
            value={username}
            onChange={(e) => { setUsername(e.target.value); clearError(); }}
            required
            autoFocus
          />

          <Input
            id="password"
            label={t('admin.password')}
            type="password"
            icon={Lock}
            placeholder="••••••"
            value={password}
            onChange={(e) => { setPassword(e.target.value); clearError(); }}
            required
          />

          <Button
            type="submit"
            fullWidth
            size="lg"
            loading={isLoading}
          >
            {t('admin.loginButton')}
          </Button>
        </form>

        <div className={styles.footer}>
          <a href="/" className={styles.backLink}>← {t('common.back')}</a>
        </div>
      </div>
    </div>
  );
}
