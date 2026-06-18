/**
 * Unit tests cho aqiService
 * Kiểm thử hàm tính AQI theo chuẩn US EPA
 */
const {
  calculateSubAQI,
  calculateAQI,
  getAQIInfo,
  getCO2Info,
  getTVOCInfo,
} = require('./aqiService');

// Bảng breakpoint PM2.5 (lấy lại để dùng trong test)
const PM25_BREAKPOINTS = [
  { bpLo: 0.0, bpHi: 12.0, aqiLo: 0, aqiHi: 50 },
  { bpLo: 12.1, bpHi: 35.4, aqiLo: 51, aqiHi: 100 },
  { bpLo: 35.5, bpHi: 55.4, aqiLo: 101, aqiHi: 150 },
  { bpLo: 55.5, bpHi: 150.4, aqiLo: 151, aqiHi: 200 },
  { bpLo: 150.5, bpHi: 250.4, aqiLo: 201, aqiHi: 300 },
  { bpLo: 250.5, bpHi: 500.4, aqiLo: 301, aqiHi: 500 },
];

describe('calculateSubAQI', () => {
  test('Nồng độ PM2.5 = 0 → AQI = 0', () => {
    expect(calculateSubAQI(0, PM25_BREAKPOINTS)).toBe(0);
  });

  test('Nồng độ PM2.5 = 12.0 (biên trên khoảng Good) → AQI = 50', () => {
    expect(calculateSubAQI(12.0, PM25_BREAKPOINTS)).toBe(50);
  });

  test('Nồng độ PM2.5 = 35.4 (biên trên khoảng Moderate) → AQI = 100', () => {
    expect(calculateSubAQI(35.4, PM25_BREAKPOINTS)).toBe(100);
  });

  test('Nồng độ PM2.5 = 55.5 (biên dưới khoảng Unhealthy) → AQI = 151', () => {
    expect(calculateSubAQI(55.5, PM25_BREAKPOINTS)).toBe(151);
  });

  test('Nồng độ PM2.5 = 500.4 (biên trên max) → AQI = 500', () => {
    expect(calculateSubAQI(500.4, PM25_BREAKPOINTS)).toBe(500);
  });

  test('Nồng độ PM2.5 vượt ngưỡng 500.4 → AQI = 500', () => {
    expect(calculateSubAQI(600, PM25_BREAKPOINTS)).toBe(500);
  });
});

describe('calculateAQI', () => {
  test('PM2.5 = 25, PM10 = 50 → AQI lấy giá trị lớn hơn', () => {
    const aqi = calculateAQI(25, 50);
    // PM2.5=25 → AQI=78, PM10=50 → AQI=46 → max = 78
    expect(aqi).toBe(78);
  });

  test('PM2.5 = 0, PM10 = 0 → AQI = 0', () => {
    expect(calculateAQI(0, 0)).toBe(0);
  });

  test('PM10 cao hơn PM2.5 → AQI theo PM10', () => {
    const aqi = calculateAQI(5, 200);
    // PM2.5=5 → ~21, PM10=200 → ~124 → max = 124
    expect(aqi).toBeGreaterThan(100);
  });
});

describe('getAQIInfo', () => {
  test('AQI = 25 → mức Good', () => {
    expect(getAQIInfo(25).level).toBe('good');
  });

  test('AQI = 75 → mức Moderate', () => {
    expect(getAQIInfo(75).level).toBe('moderate');
  });

  test('AQI = 125 → mức Unhealthy for Sensitive', () => {
    expect(getAQIInfo(125).level).toBe('unhealthy_sensitive');
  });

  test('AQI = 175 → mức Unhealthy', () => {
    expect(getAQIInfo(175).level).toBe('unhealthy');
  });

  test('AQI = 250 → mức Very Unhealthy', () => {
    expect(getAQIInfo(250).level).toBe('very_unhealthy');
  });

  test('AQI = 400 → mức Hazardous', () => {
    expect(getAQIInfo(400).level).toBe('hazardous');
  });
});

describe('getCO2Info', () => {
  test('CO2 = 400 → mức Tốt', () => {
    expect(getCO2Info(400).level).toBe('good');
  });

  test('CO2 = 1200 → mức Kém', () => {
    expect(getCO2Info(1200).level).toBe('poor');
  });
});

describe('getTVOCInfo', () => {
  test('TVOC = 30 → mức Tốt', () => {
    expect(getTVOCInfo(30).level).toBe('good');
  });

  test('TVOC = 500 → mức Kém', () => {
    expect(getTVOCInfo(500).level).toBe('poor');
  });
});
