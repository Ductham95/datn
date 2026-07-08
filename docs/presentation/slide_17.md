# Slide 17: Kết luận & Hướng phát triển

## ✅ Nội dung HIỆN trên slide (3 phần — Kết luận / Hạn chế / Hướng phát triển)

**Kết luận:**
- **9/9 chức năng + 5/5 yêu cầu phi chức năng** — 44/44 test pass, uptime 100% trong 7 ngày
- **Giải pháp duy nhất** đáp ứng đồng thời: đa thông số + LoRa + mã nguồn mở + chi phí thấp

**Hạn chế:**
- Chưa đo kiểm pin dài hạn (>1 tháng); chưa hiệu chuẩn cảm biến theo chuẩn đo lường; chưa có app di động

**Hướng phát triển:**
- ① Tối ưu phần cứng — ESP32 bare + thêm cảm biến SO₂, NO₂, O₃
- ② Tích hợp LoRaWAN — kết nối hạ tầng bên thứ ba (Chirpstack / TTN)
- ③ Dự báo AQI bằng ML — LSTM / Prophet + push notification (Email, Telegram)
- ④ Triển khai quy mô lớn — hiệu chuẩn cảm biến, app di động, thử nghiệm thực tế (trường học, bệnh viện, KCN)

## 🎤 Nội dung NÓI miệng khi trình bày

- Mở đầu: "Trước khi kết thúc, em xin tổng kết lại kết quả và đề xuất hướng phát triển cho đồ án."
- Kết luận: "Hệ thống hoàn thành đầy đủ chín chức năng và năm yêu cầu phi chức năng đã đặt ra. Toàn bộ 44 kịch bản kiểm thử đều pass, hệ thống duy trì uptime 100% trong bảy ngày trên môi trường production. So với các giải pháp đã khảo sát, đây là giải pháp duy nhất đồng thời đáp ứng bốn tiêu chí: đo đa thông số, truyền LoRa, mã nguồn mở và chi phí thấp."
- Hạn chế: "Tuy nhiên, hệ thống còn ba hạn chế chính. Một là tuổi thọ pin dài hạn trên một tháng chưa được đo kiểm thực tế. Hai là chưa tích hợp tính năng hiệu chuẩn cảm biến theo chuẩn đo lường, nên số liệu có thể lệch dần theo thời gian. Ba là giao diện chỉ hỗ trợ trình duyệt web, chưa có ứng dụng di động."
- Hướng phát triển: "Em đề xuất bốn hướng phát triển. Thứ nhất, thiết kế lại mạch dùng ESP32 bare thay vì board DevKit để tối ưu điện năng, đồng thời bổ sung cảm biến SO₂, NO₂, O₃. Thứ hai, tích hợp chuẩn LoRaWAN qua Chirpstack hoặc The Things Network để tận dụng hạ tầng mạng sẵn có và hỗ trợ downlink điều chỉnh chu kỳ đo từ xa. Thứ ba, tích hợp mô hình dự báo AQI ngắn hạn bằng LSTM hoặc Prophet, kèm push notification qua Email và Telegram. Thứ tư, hiệu chuẩn cảm biến bằng cách đặt cạnh trạm đo chuẩn, phát triển app di động, và thử nghiệm triển khai thực tế tại trường học, bệnh viện hoặc khu công nghiệp."
- Kết: "Em xin cảm ơn hội đồng đã lắng nghe. Em sẵn sàng trả lời câu hỏi."

## 🖼️ Hình ảnh / Bảng biểu

- **Hình:** Không có hình có sẵn trong `Hinhve/`. Đề xuất tạo **infographic roadmap** dạng timeline ngang với 4 icon tương ứng 4 hướng phát triển (phần cứng → LoRaWAN → ML/AI → triển khai).
- **Caption:** Lộ trình phát triển hệ thống

## 📐 Bố cục đề xuất (2 phần: Kết luận trái + Hướng phát triển phải)

```
┌──────────────────────────────────────────────────────┐
│  [Tiêu đề] Kết luận & Hướng phát triển              │
├─────────────────────┬────────────────────────────────┤
│  ✅ Kết luận         │  🔮 Hướng phát triển           │
│  • 9/9 CN + 5/5 PNC │  ① HW: ESP32 bare + SO₂/NO₂  │
│  • 44/44 test pass   │  ② LoRaWAN: Chirpstack / TTN  │
│  • Uptime 100% / 7d │  ③ ML: LSTM dự báo + notify   │
│                      │  ④ Scale: calibration + app   │
│  ⚠️ Hạn chế          │                               │
│  • Pin > 1 tháng     │                               │
│  • Chưa calibration  │                               │
│  • Chưa app di động  │                               │
├─────────────────────┴────────────────────────────────┤
│  Nguồn: Chương 6 — Kết luận (§6.1, §6.2)            │
└──────────────────────────────────────────────────────┘
```

## 🎨 Mẹo thiết kế

- Chia slide thành **2 cột rõ ràng** bằng đường kẻ dọc mỏng hoặc nền màu khác nhau
- Cột trái (Kết luận): nền xanh lá nhạt, số **9/9**, **5/5**, **44/44**, **100%** bold cỡ lớn để nhấn mạnh thành tựu
- Phần Hạn chế: nền vàng nhạt hoặc cam nhạt, font nhỏ hơn bullet kết luận
- Cột phải (Hướng phát triển): icon ①②③④ + keyword ngắn, nền xanh dương nhạt
- Giữ style nhất quán với slide 16: dark theme, icon + số thứ tự, keyword ngắn gọn

## 📎 Nguồn tham chiếu

- File: `6_Ket_luan.tex`, Section: §6.1, §6.2
- §6.1: Kết luận — 9/9 chức năng, 5/5 YCPCK, 44/44 test, uptime 100%, 3 bài học kinh nghiệm, 3 hạn chế
- §6.2: Hướng phát triển — 4 hướng: HW (ESP32 bare, thêm cảm biến), LoRaWAN, ML dự báo AQI, triển khai quy mô lớn
- Bảng tham chiếu: `table:req_mapping`, `table:bom_cost`, `table:lora_range`
