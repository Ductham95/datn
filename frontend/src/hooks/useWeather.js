import { useState, useEffect } from 'react';
import { weatherService } from '@/services/weatherService';
import { REFRESH_INTERVALS } from '@/utils/constants';

/**
 * Hook to fetch weather data for given coordinates.
 * Auto-refreshes every 5 minutes.
 */
export function useWeather(lat, lng) {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!lat || !lng) {
      setLoading(false);
      return;
    }

    const fetchWeather = async () => {
      try {
        const res = await weatherService.getWeather(lat, lng);
        // Backend returns { success, data: { temp, humidity, ... } }
        setWeather(res.data || res);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
    const interval = setInterval(fetchWeather, REFRESH_INTERVALS.WEATHER);
    return () => clearInterval(interval);
  }, [lat, lng]);

  return { weather, loading, error };
}
