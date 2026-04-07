const telemetryService = require('../services/telemetryService');
const { calculateAQI } = require('../services/aqiService');

const ingestTelemetryData = async (req, res) => {
  const { gateway_id, data } = req.body;

  try {
    console.log('Date: ', new Date());
    console.log('[Ingestion API] Dữ liệu đã được xử lý và lưu vào CSDL.');

    // processTelemetry giờ trả về danh sách alerts mới (nếu có)
    const newAlerts = await telemetryService.processTelemetry(gateway_id, data);

    // Broadcast dữ liệu telemetry mới qua Socket.IO
    if (req.io) {
      const enrichedData = data.map(item => ({
        ...item,
        aqi: calculateAQI(item.pm25 || 0, item.pm10 || 0),
        time: new Date()
      }));
      req.io.emit('new_telemetry_data', { gateway_id, data: enrichedData });

      // Broadcast alerts mới (nếu có) cho Admin Dashboard
      if (newAlerts && newAlerts.length > 0) {
        req.io.emit('new-alert', { alerts: newAlerts });
        console.log(`[Socket.IO] Broadcast ${newAlerts.length} alert(s) mới`);
      }
    }

    res.status(200).json({ success: true, message: 'Telemetry data ingested successfully' });

  } catch (error) {
    console.error('[Ingestion API] Lỗi lưu dữ liệu:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};

module.exports = { ingestTelemetryData };

