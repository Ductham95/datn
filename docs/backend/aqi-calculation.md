# AQI Calculation — Tính toán Chỉ số Chất lượng Không khí

## 1. AQI (Air Quality Index) — Theo chuẩn US EPA

### Công thức

```
AQI = ((AQI_hi - AQI_lo) / (BP_hi - BP_lo)) × (Cp - BP_lo) + AQI_lo
```

Trong đó:
- `Cp`: Nồng độ chất ô nhiễm đo được
- `BP_hi`, `BP_lo`: Breakpoint cao/thấp chứa `Cp`
- `AQI_hi`, `AQI_lo`: AQI tương ứng với breakpoint

### Bảng breakpoint PM2.5

| AQI | Mức | Màu sắc | PM2.5 (µg/m³) |
|---|---|---|---|
| 0–50 | Tốt | 🟢 Xanh lá (`#00e400`) | 0 – 12.0 |
| 51–100 | Trung bình | 🟡 Vàng (`#ffff00`) | 12.1 – 35.4 |
| 101–150 | Không tốt cho nhóm nhạy cảm | 🟠 Cam (`#ff7e00`) | 35.5 – 55.4 |
| 151–200 | Không tốt | 🔴 Đỏ (`#ff0000`) | 55.5 – 150.4 |
| 201–300 | Rất không tốt | 🟣 Tím (`#8f3f97`) | 150.5 – 250.4 |
| 301–500 | Nguy hiểm | 🟤 Nâu đỏ (`#7e0023`) | 250.5 – 500.4 |

### Bảng breakpoint PM10

| AQI | PM10 (µg/m³) |
|---|---|
| 0–50 | 0 – 54 |
| 51–100 | 55 – 154 |
| 101–150 | 155 – 254 |
| 151–200 | 255 – 354 |
| 201–300 | 355 – 424 |
| 301–500 | 425 – 604 |

### AQI tổng hợp

AQI tổng hợp = **MAX**(AQI_PM25, AQI_PM10) — lấy giá trị cao nhất.

---

## 2. Đánh giá CO₂

| CO₂ (ppm) | Mức | Ý nghĩa | Màu |
|---|---|---|---|
| ≤ 800 | 🟢 Tốt | Không khí trong lành, thông thoáng | `#00e400` |
| 800 – 1000 | 🟡 Trung bình | Chấp nhận được, nên thông gió | `#ffff00` |
| 1000 – 1500 | 🟠 Kém | Buồn ngủ, giảm tập trung | `#ff7e00` |
| 1500 – 2000 | 🔴 Xấu | Ảnh hưởng sức khỏe, cần thông gió ngay | `#ff0000` |
| > 2000 | 🟣 Nguy hiểm | Đau đầu, chóng mặt, cần di chuyển | `#7e0023` |

---

## 3. Đánh giá TVOC

| TVOC (ppb) | Mức | Ý nghĩa | Màu |
|---|---|---|---|
| ≤ 65 | 🟢 Tốt | Không khí sạch | `#00e400` |
| 65 – 220 | 🟡 Trung bình | Chấp nhận được | `#ffff00` |
| 220 – 660 | 🟠 Kém | Có thể gây kích ứng | `#ff7e00` |
| 660 – 2200 | 🔴 Xấu | Ảnh hưởng sức khỏe | `#ff0000` |
| > 2200 | 🟣 Nguy hiểm | Nguy hiểm, cần xử lý ngay | `#7e0023` |

---

## 4. Implementation

File: [`backend/src/services/aqiService.js`](../../backend/src/services/aqiService.js)

### Exported functions

```javascript
const { calculateAQI, getAQIInfo, getCO2Info, getTVOCInfo } = require('./services/aqiService');

// Tính AQI tổng hợp từ PM2.5 và PM10
const aqi = calculateAQI(12.5, 18.3);  // → 52

// Lấy thông tin mức AQI (label, color, emoji)
const info = getAQIInfo(52);
// → { level: 'moderate', label: 'Trung bình', color: '#ffff00', emoji: '🟡' }

// Đánh giá CO₂
const co2Info = getCO2Info(485);
// → { level: 'good', label: 'Tốt', color: '#00e400' }

// Đánh giá TVOC
const tvocInfo = getTVOCInfo(120);
// → { level: 'moderate', label: 'Trung bình', color: '#ffff00' }
```

---

## 5. So sánh với khuyến nghị WHO

Dashboard có thể so sánh giá trị đo được với giới hạn WHO:

| Chỉ số | Khuyến nghị WHO (24h) | Ý nghĩa |
|---|---|---|
| PM2.5 | ≤ 15 µg/m³ | Mức an toàn |
| PM10 | ≤ 45 µg/m³ | Mức an toàn |
| CO₂ | ≤ 1000 ppm | Phòng kín |

Nếu PM2.5 đo được = 102 µg/m³ → **"PM2.5 cao gấp 6.8 lần khuyến nghị WHO"**
