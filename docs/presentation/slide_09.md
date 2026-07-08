# Slide 09: Firmware Sensor Node & Gateway

## ✅ Nội dung HIỆN trên slide (3 bullet chính)

- **Sensor Node — Deep-sleep cycle** — thức dậy theo Timer → đọc cảm biến → gửi LoRa → ngủ lại; nhấn nút BOOT → hiển thị dữ liệu lịch sử lên OLED 10s (1.262 LOC C/C++)
- **Gateway — Superloop + Ring buffer** — nhận gói LoRa → tích luỹ vào bộ đệm vòng → serialize JSON batch → HTTP POST lên Backend (1.608 LOC C/C++)
- **Provisioning qua Captive Portal** — WiFi AP "AirQuality-SN-Setup" → trang web 192.168.4.1 → nhập Node ID → lưu NVS; Gateway tự đăng ký (self-provisioning) với Backend khi kết nối lần đầu

## 🎤 Nội dung NÓI miệng khi trình bày

- Mở đầu: "Slide trước em đã trình bày giao thức LoRa 18 byte, bây giờ em trình bày chi tiết firmware hai thiết bị — Sensor Node và Gateway."
- Giải thích deep-sleep: "ESP32 hỗ trợ chế độ Deep-sleep, triệt tiêu điện năng các module ngoại vi khi không dùng. Thay vì chạy vòng lặp liên tục như FreeRTOS, firmware chỉ thức dậy theo chu kỳ Timer để đọc cảm biến, đóng gói 18 byte gửi qua LoRa, lưu kết quả vào vùng nhớ RTC rồi quay lại ngủ. Nếu người dùng nhấn nút BOOT, thiết bị bỏ qua lấy mẫu, truy xuất dữ liệu từ RTC memory hiển thị lên OLED trong 10 giây."
- Giải thích gateway superloop: "Gateway không cần deep-sleep vì dùng nguồn điện trực tiếp. Em chọn kiến trúc superloop — vòng lặp chính tuần tự: nhận gói tin từ UART LoRa, cập nhật OLED, tích luỹ vào ring buffer. Khi đủ số lượng gói hoặc hết chu kỳ thời gian, Gateway serialize bộ đệm thành JSON array và gửi lên Backend qua HTTP POST. Kiến trúc này đơn giản hơn FreeRTOS mà vẫn đáp ứng yêu cầu, vì các tác vụ đều tuần tự."
- Giải thích provisioning: "Khi Sensor Node chưa có cấu hình hoặc sau factory reset (giữ nút BOOT 5 giây), thiết bị phát WiFi AP với SSID 'AirQuality-SN-Setup' và phục vụ trang web captive portal tại 192.168.4.1. Người dùng nhập Node ID, firmware lưu vào NVS và khởi động lại. Gateway cũng có cơ chế tương tự — tự đăng ký với Backend Server khi kết nối lần đầu."
- Chuyển tiếp: "Với firmware hoàn chỉnh ở tầng cảm biến và tầng trung chuyển, slide tiếp theo em sẽ trình bày Backend pipeline — cách tầng máy chủ xử lý dữ liệu từ Gateway."

## 🖼️ Hình ảnh / Bảng biểu

- **Hình:** Sơ đồ flowchart deep-sleep cycle (cần tạo mới — chưa có trong Hinhve/)
  - Mô tả: Flowchart 2 nhánh: Timer wakeup → Init HW → Read sensors → Warm-up → ADC battery → Pack 18B → Send LoRa → Save RTC → Deep-sleep ← Button wakeup → Read RTC → Display OLED 10s → Deep-sleep
- **Hình thay thế (nếu không tạo flowchart):** Dùng sơ đồ ASCII trực tiếp trên slide hoặc ảnh setup thực tế
- **Caption:** Chu trình hoạt động firmware Sensor Node & Gateway

## 📐 Bố cục đề xuất (2 cột: bullet trái + flowchart phải)

```
┌──────────────────────────────────────────────────────┐
│  [Tiêu đề] Firmware Sensor Node & Gateway            │
├────────────────────────┬─────────────────────────────┤
│                        │                             │
│  ⚡ Sensor Node         │  [Flowchart Deep-sleep]     │
│  • Deep-sleep cycle    │                             │
│  • Timer → cảm biến   │  ┌──────┐    ┌──────────┐   │
│    → LoRa → ngủ       │  │Timer │───→│Init HW   │   │
│  • Nút BOOT → OLED    │  │Wake  │    │Read Sens.│   │
│    hiển thị 10s        │  └──────┘    │Pack 18B  │   │
│                        │       ↑      │Send LoRa │   │
│  📡 Gateway            │       │      │Save RTC  │   │
│  • Superloop + ring    │  ┌────┴───┐  └────┬─────┘   │
│    buffer              │  │Deep-   │←──────┘         │
│  • JSON batch →        │  │sleep   │                 │
│    HTTP POST           │  └────────┘                 │
│                        │                             │
│  🔧 Provisioning       │  Button Wake → OLED 10s     │
│  • Captive Portal      │  → Deep-sleep               │
│    WiFi AP + NVS       │                             │
│                        │                             │
├────────────────────────┴─────────────────────────────┤
│  Nguồn: §4.2.2 báo cáo                       (nhỏ) │
└──────────────────────────────────────────────────────┘
```

## 🎨 Mẹo thiết kế

- Chia slide thành **2 khu vực chính** bằng đường kẻ mảnh: phần trên cho Sensor Node (icon ⚡), phần dưới cho Gateway (icon 📡)
- Bold **"Deep-sleep"** và **"Superloop"** cỡ lớn, dùng **màu xanh lá** cho deep-sleep (tiết kiệm năng lượng), **màu cam** cho superloop (luôn hoạt động)
- Flowchart dùng **icon nhỏ** cho mỗi bước: 🔋 (battery), 📊 (sensor), 📡 (LoRa), 💤 (sleep)
- Số LOC (**1.262** và **1.608**) hiển thị nhỏ dạng badge bên cạnh tên thành phần
- Nút provisioning dùng **icon WiFi 📶** để nhấn mạnh tính năng cấu hình không dây

## 📎 Nguồn tham chiếu

- File: `4_Ket_qua_thuc_nghiem.tex`, Section: §4.2.2 (Thiết kế firmware — Firmware Sensor Node & Gateway)
- Bảng tham chiếu: Bảng thống kê LOC (table:stats) — Sensor Node: 1.262 LOC, Gateway: 1.608 LOC
