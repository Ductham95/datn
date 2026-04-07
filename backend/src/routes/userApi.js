const express = require('express');
const router = express.Router();

const { getDashboardStations, getNearestStation, getStationHistory, getStationRanking } = require('../controllers/stationController');
const { getWeather } = require('../controllers/weatherController');

// View Dữ liệu & Bản đồ AQI
router.get('/stations/dashboard', getDashboardStations);
router.get('/stations/nearest', getNearestStation);
router.get('/stations/ranking', getStationRanking);
router.get('/stations/:id/history', getStationHistory);

// API Mở rộng
router.get('/weather', getWeather);

module.exports = router;
