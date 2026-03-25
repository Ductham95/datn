const exportService = require('../services/exportService');

const exportMeasurements = async (req, res) => {
  const { node_id, limit } = req.query;
  
  try {
    const csv = await exportService.getExportCsvData(node_id, limit);

    res.header('Content-Type', 'text/csv');
    res.attachment(`export_measurements_${Date.now()}.csv`);
    return res.send(csv);

  } catch (error) {
    if (error.message === 'Không có dữ liệu để xuất') {
      return res.status(404).json({ success: false, error: error.message });
    }
    console.error('[Admin Export API]', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};

module.exports = { exportMeasurements };
