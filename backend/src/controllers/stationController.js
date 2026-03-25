const stationService = require('../services/stationService');

const getDashboardStations = async (req, res) => {
  try {
    const data = await stationService.getDashboardData();
    // console.log(data); // log data
    res.json({ success: true, data });
  } catch (error) {
    console.error('[Dashboard API]', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};

const getNearestStation = async (req, res) => {
  const { lat, lng } = req.query;
  
  if (!lat || !lng) {
    return res.status(400).json({ success: false, error: 'Vui lòng cung cấp tọa độ lat và lng' });
  }

  try {
    const data = await stationService.getNearestStationData(lat, lng);
    res.json({ success: true, data });
  } catch (error) {
    if (error.message === 'Không tìm thấy trạm nào') {
      return res.status(404).json({ success: false, error: error.message });
    }
    console.error('[Nearest Node API]', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};

const getStationHistory = async (req, res) => {
  const { id } = req.params;
  const { type, limit } = req.query;

  try {
    const chartData = await stationService.getHistoryData(id, type, limit);
    res.json({ success: true, data: chartData });
  } catch (error) {
    console.error('[History API]', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};

module.exports = { getDashboardStations, getNearestStation, getStationHistory };
