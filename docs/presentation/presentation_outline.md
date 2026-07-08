# Outline bản trình chiếu bảo vệ ĐATN

> **Đề tài:** Xây dựng hệ thống IoT giám sát chất lượng không khí sử dụng LoRa và cảm biến chi phí thấp
> **Sinh viên:** Nguyễn Đức Thắm — MSSV: 20225395
> **Thời lượng dự kiến:** ~15 phút trình bày + 5 phút Q&A

---

## Slide 1: Trang bìa
- Tên đề tài, sinh viên, GVHD, trường/viện, ngày bảo vệ
- **Nguồn từ báo cáo:** Bìa (`Bia.tex`)

## Slide 2: Nội dung trình bày (Agenda)
- Danh sách các phần sẽ trình bày (6 mục chính)

---

## Slide 3–4: Đặt vấn đề & Động lực
- **Slide 3:** Thực trạng ô nhiễm không khí
  - PM2.5 tại VN cao gấp ~6 lần ngưỡng WHO, Hà Nội gấp 9 lần
  - Chỉ ~35 trạm đo tự động trên cả nước → không đủ giám sát vi mô
  - **Hình ảnh:** Bản đồ ô nhiễm / infographic số liệu WHO/IQAir
- **Slide 4:** Hạn chế của giải pháp hiện tại
  - Bảng so sánh 4 hệ thống: PAM Air, IQAir, PurpleAir, VN-AQI
  - Highlight: không hệ thống nào đáp ứng đồng thời 4 tiêu chí (đa thông số, LoRa, mã nguồn mở, chi phí thấp)
  - **Bảng:** Lấy từ Bảng 2.1 trong báo cáo (đơn giản hóa cho slide)
  - **Nguồn từ báo cáo:** `1_Gioi_thieu.tex` (§1.1, §1.2), `2_Khao_sat.tex` (§2.1)

## Slide 5: Mục tiêu đề tài
- 5 chức năng chính (thu thập 6 thông số, truyền LoRa, tính AQI, dashboard realtime, admin panel)
- Mã nguồn mở hoàn toàn
- **Nguồn từ báo cáo:** `1_Gioi_thieu.tex` (§1.2)

---

## Slide 6: Kiến trúc tổng thể hệ thống
- Sơ đồ 4 tầng: Sensor Node → Gateway → Backend → Frontend
- Mô tả ngắn gọn vai trò từng tầng và giao thức giữa chúng (LoRa → HTTP → Socket.IO)
- **Hình ảnh:** `Hinhve/system-architecture-simple.png`
- **Nguồn từ báo cáo:** `3_Cong_nghe.tex` (§3.1), `4_Ket_qua_thuc_nghiem.tex` (§4.1)

## Slide 7: Phần cứng & Cảm biến
- Danh sách linh kiện: ESP32, PMS7003, CCS811, AHT10, AS32-TTL-100 (LoRa)
- Bảng thông số cảm biến (đo gì, giao tiếp, chi phí)
- Sơ đồ mạch Sensor Node
- **Hình ảnh:** `Hinhve/schematic_sensor_node.png`
- **Bảng:** Bảng 3.2 (thông số cảm biến) — rút gọn
- **Nguồn từ báo cáo:** `3_Cong_nghe.tex` (§3.2), `4_Ket_qua_thuc_nghiem.tex` (§4.2.1)

## Slide 8: Giao thức LoRa Binary 18 byte
- Cấu trúc gói tin: header (3B) + payload (14B) + battery (1B)
- So sánh: 18 byte binary vs ~200 byte JSON → giảm air-time ~11 lần
- Cơ chế chống trùng lặp (deduplication) bằng msgId
- **Hình ảnh:** `Hinhve/packet_lora.png`
- **Nguồn từ báo cáo:** `4_Ket_qua_thuc_nghiem.tex` (§4.2.2), `5_Giai_phap_dong_gop.tex` (§5.2)

## Slide 9: Firmware Sensor Node & Gateway
- Sensor Node: Deep-sleep cycle → tiết kiệm năng lượng
- Gateway: Superloop + ring buffer + HTTP batch
- Provisioning qua captive portal (WiFi AP)
- **Hình ảnh:** Flowchart deep-sleep (có thể dùng hình mô tả trong báo cáo hoặc tạo sơ đồ)
- **Nguồn từ báo cáo:** `4_Ket_qua_thuc_nghiem.tex` (§4.2.2)

---

## Slide 10: Backend — Kiến trúc phân lớp
- Mô hình 3 lớp: Routes → Controllers → Services → Config
- Pipeline xử lý telemetry 3 bước: Dedup → Transaction (lưu DB) → Alert (ngoài transaction)
- Highlight: lỗi cảnh báo KHÔNG ảnh hưởng lưu dữ liệu (zero data loss)
- **Hình ảnh:** `Hinhve/seq_telemetry_ingestion.png` (biểu đồ trình tự) hoặc `Hinhve/module_backend_services.png`
- **Nguồn từ báo cáo:** `4_Ket_qua_thuc_nghiem.tex` (§4.2.4), `5_Giai_phap_dong_gop.tex` (§5.3)

## Slide 11: Cơ sở dữ liệu & Tính AQI
- ERD tóm tắt: 7 bảng + 1 materialized view
- TimescaleDB: Hypertable, Continuous Aggregate, Retention Policy
- PostGIS: truy vấn trạm gần nhất
- Công thức AQI nội suy tuyến tính US EPA
- **Hình ảnh:** `Hinhve/er_database.png`
- **Công thức:** Công thức (3.1) từ báo cáo
- **Nguồn từ báo cáo:** `4_Ket_qua_thuc_nghiem.tex` (§4.2.5), `3_Cong_nghe.tex` (§3.6)

---

## Slide 12–13: Demo giao diện
- **Slide 12:** Giao diện Người dùng
  - Dashboard (6 thẻ thông số, bản đồ, biểu đồ, khuyến nghị sức khỏe)
  - Bản đồ AQI (Leaflet + mã màu US EPA)
  - Lịch sử & Xếp hạng
  - **Hình ảnh:** `Hinhve/dashboard.png`, `Hinhve/ban_do_aqi.png`
- **Slide 13:** Giao diện Quản trị
  - Admin Dashboard, quản lý thiết bị, giám sát cảnh báo, cấu hình ngưỡng
  - **Hình ảnh:** `Hinhve/dashboard_quan_tri.png`, `Hinhve/giam_sat_canh_bao.png`
- **Nguồn từ báo cáo:** `4_Ket_qua_thuc_nghiem.tex` (§4.3.3)

---

## Slide 14: Kiểm thử & Triển khai
- 44/44 test case pass (25 thủ công + 19 unit test AQI)
- Triển khai Docker Compose trên DigitalOcean VPS
- Uptime 100% trong 7 ngày thử nghiệm
- **Bảng:** Tóm tắt kết quả kiểm thử (tên chức năng + số test case + kết quả)
- **Hình ảnh:** `Hinhve/deployment_diagram.png`
- **Nguồn từ báo cáo:** `4_Ket_qua_thuc_nghiem.tex` (§4.4, §4.5)

## Slide 15: Thực nghiệm thực tế
- Kịch bản 1: Thử nghiệm mất kết nối thiết bị (phát hiện offline sau 5–40 phút)
- Kịch bản 2: Thử nghiệm khói hương (PM2.5 tăng từ 18 → 658 µg/m³ → phục hồi)
- Khoảng cách LoRa: 800m trong không gian thoáng
- **Hình ảnh:** Ảnh setup thử nghiệm, bảng/biểu đồ dữ liệu đo
- **Nguồn từ báo cáo:** `4_Ket_qua_thuc_nghiem.tex` (§4.5.1)

---

## Slide 16: Đóng góp chính
- 4 đóng góp nổi bật (format: bài toán → giải pháp → kết quả)
  1. Hệ thống IoT đa tầng end-to-end (14.036 LOC, 4 miền kỹ thuật)
  2. Giao thức LoRa binary 18B (giảm air-time 11×, deduplication)
  3. Pipeline telemetry Backend (zero data loss, 44/44 test pass)
  4. Chi phí thấp + mã nguồn mở (~875K VNĐ/node, rẻ hơn IQAir 11×)
- **Bảng:** So sánh hệ thống đề xuất vs các giải pháp hiện có
- **Nguồn từ báo cáo:** `5_Giai_phap_dong_gop.tex`

## Slide 17: Kết luận & Hướng phát triển
- Tóm tắt: hệ thống đáp ứng 9/9 chức năng, 5/5 yêu cầu phi chức năng
- Hạn chế: tuổi thọ pin dài hạn, chưa hiệu chuẩn cảm biến, chưa có app di động
- 4 hướng phát triển: tối ưu phần cứng, LoRaWAN, dự báo AQI bằng ML, triển khai quy mô lớn
- **Nguồn từ báo cáo:** `6_Ket_luan.tex`

## Slide 18: Q&A
- Cảm ơn hội đồng
- Thông tin liên hệ / link GitHub

---

## Tổng kết cấu trúc

| Nhóm | Slide | Nội dung | Thời lượng |
|------|-------|----------|------------|
| Mở đầu | 1–2 | Bìa, Agenda | ~1 phút |
| Bài toán | 3–5 | Đặt vấn đề, khảo sát, mục tiêu | ~3 phút |
| Giải pháp | 6–9 | Kiến trúc, phần cứng, LoRa, firmware | ~4 phút |
| Backend & DB | 10–11 | Backend pipeline, CSDL, AQI | ~2 phút |
| Demo | 12–13 | Giao diện User + Admin | ~2 phút |
| Đánh giá | 14–15 | Kiểm thử, triển khai, thực nghiệm | ~2 phút |
| Kết | 16–18 | Đóng góp, kết luận, Q&A | ~2 phút |
