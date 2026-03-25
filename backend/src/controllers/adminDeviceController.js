const deviceService = require('../services/deviceService');

const getGateways = async (req, res) => {
  try {
    const data = await deviceService.getAllGateways();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getNodes = async (req, res) => {
  try {
    const data = await deviceService.getAllNodes();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = { getGateways, getNodes };
