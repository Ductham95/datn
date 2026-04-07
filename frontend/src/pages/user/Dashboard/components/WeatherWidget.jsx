import { useTranslation } from 'react-i18next';
import { CloudSun, Wind, Droplets, Thermometer, Sun, Cloud, CloudRain } from 'lucide-react';
import Card from '@/components/ui/Card/Card';
import styles from './WeatherWidget.module.css';

export default function WeatherWidget({ weather, sensorTemp, sensorHumidity }) {
  const { t } = useTranslation();

  // If we have OpenWeatherMap data
  if (weather) {
    // Handle both raw OWM format and our backend-transformed format
    const temp = weather.temp ?? weather.main?.temp;
    const humidity = weather.humidity ?? weather.main?.humidity;
    const windSpeed = weather.wind_speed ?? weather.wind?.speed;
    const description = weather.description ?? weather.weather?.[0]?.description;
    const icon = weather.icon ?? weather.weather?.[0]?.icon;

    return (
      <Card title={t('dashboard.weatherTitle')} icon={CloudSun} padding="md">
        <div className={styles.content}>
          <div className={styles.mainInfo}>
            {icon && (
              <img
                src={`https://openweathermap.org/img/wn/${icon}@2x.png`}
                alt={description}
                className={styles.weatherIcon}
              />
            )}
            <div>
              <span className={styles.temp}>{Math.round(temp)}°C</span>
              <span className={styles.desc}>{description}</span>
            </div>
          </div>
          <div className={styles.details}>
            <div className={styles.detailItem}>
              <Droplets size={14} />
              <span>{humidity}%</span>
            </div>
            <div className={styles.detailItem}>
              <Wind size={14} />
              <span>{windSpeed} m/s</span>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  // Fallback: show sensor data when weather API is unavailable
  if (sensorTemp != null || sensorHumidity != null) {
    return (
      <Card title={t('dashboard.weatherTitle')} icon={CloudSun} padding="md">
        <div className={styles.content}>
          <div className={styles.mainInfo}>
            <div className={styles.sensorIcon}>
              <Thermometer size={28} />
            </div>
            <div>
              <span className={styles.temp}>
                {sensorTemp != null ? `${Number(sensorTemp).toFixed(1)}°C` : '--'}
              </span>
              <span className={styles.desc}>Dữ liệu từ cảm biến</span>
            </div>
          </div>
          <div className={styles.details}>
            <div className={styles.detailItem}>
              <Droplets size={14} />
              <span>{sensorHumidity != null ? `${Number(sensorHumidity).toFixed(0)}%` : '--'}</span>
            </div>
            <div className={styles.detailItem}>
              <Thermometer size={14} />
              <span>Sensor</span>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  // No data at all
  return (
    <Card title={t('dashboard.weatherTitle')} icon={CloudSun} padding="md">
      <p className={styles.noData}>{t('dashboard.noData')}</p>
    </Card>
  );
}
