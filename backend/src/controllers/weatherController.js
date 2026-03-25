const weatherService = require('../services/weatherService');

const getWeather = async (req, res) => {
  const { lat, lng } = req.query;

  if (!lat || !lng) {
    return res.status(400).json({ success: false, error: 'Thiếu lat / lng' });
  }

  try {
    const data = await weatherService.fetchWeatherData(lat, lng);

    res.json({
      success: true,
      data
    });
  } catch (error) {
    if (error.message === 'Chưa cấu hình API Key thời tiết server-side') {
      return res.status(500).json({ success: false, error: error.message });
    }
    if (error.status) {
      return res.status(error.status).json({ success: false, error: error.message });
    }
    console.error('[Weather Proxy]', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};

module.exports = { getWeather };
