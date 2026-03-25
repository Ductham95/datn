const fetchWeatherData = async (lat, lng) => {
  const WEATHER_API_KEY = process.env.WEATHER_API_KEY;

  if (!WEATHER_API_KEY) {
    throw new Error('Chưa cấu hình API Key thời tiết server-side');
  }

  const fetch = (await import('node-fetch')).default;
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${WEATHER_API_KEY}&units=metric&lang=vi`;
  
  const response = await fetch(url);
  const data = await response.json();

  if (!response.ok) {
    const err = new Error(data.message);
    err.status = response.status;
    throw err;
  }

  return {
    temp: data.main.temp,
    humidity: data.main.humidity,
    wind_speed: data.wind.speed,
    description: data.weather[0].description,
    icon: data.weather[0].icon
  };
};

module.exports = { fetchWeatherData };
