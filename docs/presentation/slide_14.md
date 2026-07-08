# Slide 14: Kiểm thử & Triển khai

## ✅ Nội dung HIỆN trên slide (4 bullet chính)

- **44/44 test case pass (100%)** — 25 kiểm thử thủ công (6 chức năng: Dashboard, Quản lý thiết bị, Cảnh báo, Lịch sử, Bản đồ, Xuất CSV) + 19 unit test tự động (module aqiService, framework Jest)
- **Triển khai Docker Compose** — 4 container: db (TimescaleDB), backend (Node.js), nginx (reverse proxy + static), certbot (SSL tự động 12h)
- **VPS DigitalOcean** — 1 vCPU, 1 GB RAM, Ubuntu 22.04; domain `datn.thamnguyen.dev` + HTTPS (Let's Encrypt); deploy 1 lệnh duy nhất
- **Uptime 100% trong 7 ngày** — không tràn bộ nhớ, không restart ngoài ý muốn; Socket.IO realtime hoạt động ổn định

## 🎤 Nội dung NÓI miệng khi trình bày

- Mở đầu: "Sau khi trình bày xong giao diện hệ thống, em xin trình bày kết quả kiểm thử và triển khai."
- Giải thích kiểm thử: "Em thực hiện tổng cộng 44 test case, chia thành hai nhóm. Nhóm thứ nhất là 25 test case kiểm thử chức năng thủ công, bao phủ sáu chức năng chính: Dashboard 5 case, Quản lý thiết bị 6 case, Giám sát cảnh báo 6 case, Lịch sử 3 case, Bản đồ AQI 3 case và Xuất CSV 2 case. Nhóm thứ hai là 19 unit test tự động bằng Jest cho module tính AQI — module này là pure function nên không cần mock database. Tất cả 44/44 đều pass."
- Giải thích triển khai: "Hệ thống được đóng gói bằng Docker Compose gồm 4 container: database TimescaleDB, backend Node.js, Nginx làm reverse proxy đồng thời phục vụ file static frontend, và Certbot tự gia hạn SSL mỗi 12 giờ. Toàn bộ triển khai trên VPS DigitalOcean cấu hình nhỏ, chỉ cần 1 vCPU và 1 GB RAM."
- Giải thích uptime: "Trong 7 ngày vận hành thử nghiệm, 4 container duy trì uptime 100%, không xảy ra tràn bộ nhớ hay restart. Socket.IO realtime hoạt động trơn tru — khi có dữ liệu mới từ Gateway, dashboard cập nhật tức thì."
- Chuyển tiếp: "Slide tiếp theo em sẽ trình bày chi tiết hai kịch bản thực nghiệm thực tế."

## 🖼️ Hình ảnh / Bảng biểu

- **Hình:** `deployment_diagram_simple.drawio` → xuất PNG — Biểu đồ triển khai đơn giản (bỏ UML stereotype, volume, port chi tiết)
- **Bảng:** Tóm tắt kết quả kiểm thử

| Chức năng | Phương pháp | Số TC | Kết quả |
|-----------|-------------|-------|---------|
| Xem Dashboard | Thủ công | 5 | ✅ 5/5 |
| Quản lý thiết bị | Thủ công | 6 | ✅ 6/6 |
| Giám sát cảnh báo | Thủ công | 6 | ✅ 6/6 |
| Lịch sử + Bản đồ + CSV | Thủ công | 8 | ✅ 8/8 |
| Module AQI | Unit test (Jest) | 19 | ✅ 19/19 |
| **Tổng** | | **44** | **✅ 44/44** |

- **Caption bảng:** Tổng hợp 44/44 test case pass (100%)

## 📐 Bố cục đề xuất (2 cột: bảng trái + hình phải)

```
┌──────────────────────────────────────────────────────┐
│  [Tiêu đề] Kiểm thử & Triển khai                    │
├──────────────────────────┬───────────────────────────┤
│  📊 Kiểm thử: 44/44 pass │  [deployment_diagram.png] │
│                          │                           │
│  ┌──────────────────┐    │                           │
│  │ Bảng tóm tắt TC  │    │                           │
│  │ (5 dòng + tổng)  │    │                           │
│  └──────────────────┘    │                           │
│                          │                           │
│  🐳 Triển khai           │                           │
│  • 4 container Docker    │                           │
│  • VPS 1vCPU/1GB RAM     │                           │
│  • Uptime 100% / 7 ngày  │                           │
├──────────────────────────┴───────────────────────────┤
│  🌐 datn.thamnguyen.dev | HTTPS Let's Encrypt (nhỏ) │
└──────────────────────────────────────────────────────┘
```

## 🎨 Mẹo thiết kế

- Bảng kiểm thử chiếm **phần trái ~55%**, cột "Kết quả" highlight ✅ xanh lá, dòng Tổng bold nền đậm
- Hình `deployment_diagram.png` chiếm **phần phải ~45%**, hiển thị rõ 4 container và đường kết nối
- Số **44/44** và **100%** hiển thị cỡ lớn, bold, màu xanh lá để nhấn mạnh kết quả hoàn hảo
- Phần triển khai dùng icon 🐳 (Docker) kèm 2–3 keyword ngắn bên dưới bảng
- Dòng footer nhỏ hiển thị domain + HTTPS — minh chứng hệ thống đang chạy thật
- Giữ style nhất quán với slide 12–13: dark theme, viền/shadow quanh hình, keyword ngắn

## 📎 Nguồn tham chiếu

- File: `4_Ket_qua_thuc_nghiem.tex`, Section: §4.4 (Kiểm thử — 7 subsection: Dashboard, Quản lý thiết bị, Cảnh báo, Lịch sử, Bản đồ AQI, Xuất CSV, Unit test AQI)
- File: `4_Ket_qua_thuc_nghiem.tex`, Section: §4.4.8 (Tổng kết kiểm thử — 44/44 pass, 25 thủ công + 19 unit test)
- File: `4_Ket_qua_thuc_nghiem.tex`, Section: §4.5 (Triển khai — Docker Compose 4 container, VPS DigitalOcean 1vCPU/1GB, domain datn.thamnguyen.dev, HTTPS Let's Encrypt)
- Hình tham chiếu: `fig:deployment_diagram` (Biểu đồ triển khai), `fig:docker_ps` (docker ps production)
- Bảng tham chiếu: `table:test_dashboard`, `table:test_device`, `table:test_alert`, `table:test_history`, `table:test_map`, `table:test_export`, `table:test_aqi_unit`
