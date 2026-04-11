# Frontend Architecture — Kiến trúc Giao diện Web

## Tổng quan

Frontend là ứng dụng **Single Page Application (SPA)** được xây dựng bằng **React 19 + Vite 6**, phục vụ 2 nhóm người dùng:

- **Người dùng (User)**: Dashboard giám sát chất lượng không khí thời gian thực
- **Quản trị viên (Admin)**: Quản lý thiết bị, cấu hình, tài khoản

| Thuộc tính | Chi tiết |
|---|---|
| **Framework** | React 19 |
| **Build Tool** | Vite 6 |
| **State Management** | Zustand |
| **Routing** | React Router 7 |
| **HTTP Client** | Axios |
| **Styling** | CSS Modules + Design Tokens |
| **Charts** | ECharts (echarts-for-react) |
| **Maps** | Leaflet + react-leaflet |
| **Realtime** | Socket.IO Client |
| **i18n** | react-i18next (VI/EN) |

---

## Cấu trúc thư mục

```
frontend/src/
├── App.jsx                     # Root component + Router (13 routes, lazy-loaded)
├── components/
│   ├── ui/                     # 10 reusable UI components
│   │   ├── Button/             # Button (variants: primary/secondary/ghost/danger)
│   │   ├── Card/               # Card container
│   │   ├── Input/              # Form input
│   │   ├── Modal/              # Dialog modal
│   │   ├── Badge/              # Status badge
│   │   ├── Spinner/            # Loading spinner + skeleton
│   │   ├── DataTable/          # Sortable, searchable, paginated table
│   │   ├── Select/             # Dropdown select
│   │   ├── EmptyState/         # No-data placeholder
│   │   └── Pagination/         # Page navigation
│   ├── charts/
│   │   └── HistoryChart/       # ECharts bar chart (lịch sử 24h)
│   ├── map/
│   │   └── AQIMap/             # Leaflet map với AQI markers
│   └── common/
│       ├── AQIBadge/           # AQI value + label badge
│       └── MetricCard/         # Metric display card
├── pages/
│   ├── user/                   # 5 trang người dùng
│   │   ├── Dashboard/          # Dashboard chính (6 MetricCards + Map + Chart)
│   │   ├── MapView/            # Bản đồ AQI toàn khu vực
│   │   ├── StationDetail/      # Chi tiết node (metrics + history chart)
│   │   ├── Ranking/            # Xếp hạng ô nhiễm
│   │   └── NotFound/           # 404
│   └── admin/                  # 8 trang quản trị
│       ├── Login/              # Đăng nhập JWT
│       ├── AdminDashboard/     # Tổng quan (3 MetricCards)
│       ├── Gateways/           # CRUD Gateways (DataTable + Modal)
│       ├── SensorNodes/        # CRUD Sensor Nodes (battery bar, RSSI)
│       ├── Alerts/             # Cảnh báo (severity filter + acknowledge)
│       ├── Config/             # Cấu hình ngưỡng (6 cards threshold forms)
│       ├── Users/              # Quản lý tài khoản (CRUD + role)
│       ├── AuditLogs/          # Nhật ký hệ thống (read-only)
│       ├── Export/             # Xuất CSV (node selector + date range)
│       └── TelemetryLogs/      # Xem raw telemetry data từ sensor nodes
├── layouts/
│   ├── UserLayout/             # Layout người dùng (header + sidebar + content)
│   └── AdminLayout/            # Layout admin (sidebar + content)
├── services/                   # API service layer
│   ├── api.js                  # Axios instance (base URL, interceptors)
│   ├── stationService.js       # Dashboard, nearest, history, ranking
│   ├── weatherService.js       # OpenWeatherMap proxy
│   ├── authService.js          # Login/logout
│   ├── deviceService.js        # Admin: gateways, nodes
│   └── adminService.js         # Admin: alerts, config, users, logs, export
├── hooks/                      # Custom React hooks
│   ├── useDashboard.js         # Fetch + auto-refresh dashboard data
│   ├── useWeather.js           # Fetch weather with refresh interval
│   ├── useGeolocation.js       # Browser GPS position
│   ├── useSocket.js            # Socket.IO connection management
│   └── useStationHistory.js    # Fetch station history chart data
├── stores/                     # Zustand state stores
│   ├── useAuthStore.js         # JWT token + user info + login/logout
│   └── useTelemetryStore.js    # Realtime telemetry buffer
├── router/
│   └── ProtectedRoute.jsx      # Admin route guard (check JWT)
├── i18n/                       # Internationalization
│   ├── index.js                # i18next config
│   ├── vi.json                 # Vietnamese translations
│   └── en.json                 # English translations
├── utils/
│   ├── constants.js            # API endpoints, map config, intervals
│   ├── aqi.js                  # AQI calculation, levels, colors
│   └── formatters.js           # Number, date, battery, RSSI formatters
└── styles/
    ├── index.css               # CSS reset + design tokens (CSS variables)
    └── theme.css               # Color palette, shadows, radius
```

---

## Luồng dữ liệu

```
Backend API ─────┐
                  │  Axios (services/)
                  ▼
            Custom Hooks ──── Zustand Store
            (useDashboard     (useTelemetryStore
             useWeather)       useAuthStore)
                  │
                  ▼
           React Components
           (pages/ + components/)
                  │
                  ▼
           CSS Modules + Design Tokens
```

### Realtime Flow
```
Backend Socket.IO ──▶ useSocket hook ──▶ useTelemetryStore ──▶ Dashboard (auto-merge)
```

---

## Routing

| Path | Component | Auth | Mô tả |
|---|---|---|---|
| `/` | Dashboard | — | Dashboard chính |
| `/map` | MapView | — | Bản đồ AQI |
| `/ranking` | Ranking | — | Xếp hạng ô nhiễm |
| `/station/:id` | StationDetail | — | Chi tiết trạm |
| `/admin/login` | Login | — | Đăng nhập admin |
| `/admin` | AdminDashboard | JWT | Tổng quan admin |
| `/admin/gateways` | Gateways | JWT | Quản lý gateways |
| `/admin/nodes` | SensorNodes | JWT | Quản lý sensor nodes |
| `/admin/alerts` | Alerts | JWT | Cảnh báo hệ thống |
| `/admin/config` | Config | JWT | Cấu hình ngưỡng |
| `/admin/users` | Users | JWT | Quản lý tài khoản |
| `/admin/logs` | AuditLogs | JWT | Nhật ký hệ thống |
| `/admin/export` | Export | JWT | Xuất dữ liệu CSV |
| `/admin/telemetry-logs` | TelemetryLogs | JWT | Xem telemetry logs |

> [!NOTE]
> Tất cả routes admin được bảo vệ bởi `ProtectedRoute` — kiểm tra JWT token trong Zustand store.

---

## Design System

### CSS Variables (Design Tokens)

```css
/* Colors */
--color-primary-500: #6366F1;    /* Indigo */
--color-danger: #EF4444;         /* Red */
--color-warning: #F59E0B;        /* Amber */
--color-success: #22C55E;        /* Green */

/* Typography */
--font-family: 'Inter', sans-serif;
--font-size-xs: 0.75rem;
--font-size-sm: 0.875rem;
--font-size-base: 1rem;

/* Spacing */
--space-1: 0.25rem;
--space-2: 0.5rem;
--space-4: 1rem;

/* Shadows */
--shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
--shadow-card: 0 1px 3px rgba(0,0,0,0.1);
```

### AQI Color Scale (US EPA)

| AQI | Mức | Màu |
|---|---|---|
| 0–50 | Tốt | 🟢 `#22C55E` |
| 51–100 | Trung bình | 🟡 `#EAB308` |
| 101–150 | Không tốt cho nhóm nhạy cảm | 🟠 `#F97316` |
| 151–200 | Không tốt | 🔴 `#EF4444` |
| 201–300 | Rất không tốt | 🟣 `#8B5CF6` |
| 301–500 | Nguy hiểm | 🔴 `#991B1B` |

---

## Internationalization (i18n)

Hỗ trợ **Tiếng Việt** (mặc định) và **Tiếng Anh**. Chuyển đổi ngôn ngữ bằng nút trên header/sidebar.

Cấu trúc file dịch:
```json
{
  "dashboard": {
    "title": "Chất lượng không khí khu vực của bạn",
    "realtime": "Thời gian thực",
    "mapTitle": "Bản đồ AQI khu vực",
    "historyTitle": "Lịch sử 24 giờ"
  },
  "metrics": {
    "aqi": "Chỉ số AQI",
    "pm25": "PM2.5",
    "temperature": "Nhiệt độ"
  }
}
```
