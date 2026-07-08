# Slide 04: Hạn chế của giải pháp hiện tại

## ✅ Nội dung HIỆN trên slide (3 bullet + 1 bảng)

- **Không hệ thống nào đáp ứng đồng thời 4 tiêu chí:** đa thông số, LoRa tầm xa, mã nguồn mở, chi phí thấp
- **WiFi/4G bắt buộc** tại mỗi điểm đo → không triển khai được nơi thiếu hạ tầng mạng
- **Mã nguồn đóng** → không tùy biến, không tích hợp bên thứ ba

## 🎤 Nội dung NÓI miệng khi trình bày

- Giới thiệu: "Em đã khảo sát 4 hệ thống tiêu biểu — cả trong nước và quốc tế — để xác định khoảng trống mà chưa giải pháp nào giải quyết được."
- Giải thích từng hệ thống:
  - "PAM Air phủ hơn 3.000 trạm nhưng chỉ đo PM2.5, mã nguồn đóng, mỗi trạm cần WiFi riêng."
  - "IQAir có dự báo AI nhưng chi phí ~10 triệu VNĐ/thiết bị và phần mềm đóng."
  - "PurpleAir có API mở song chỉ đo bụi mịn và vẫn phụ thuộc WiFi."
  - "VN-AQI đạt chuẩn FEM nhưng chi phí hàng trăm triệu đến hàng tỷ/trạm, chỉ ~35 trạm cả nước."
- Nhấn mạnh: "Đặc biệt, không hệ thống nào hỗ trợ LoRa — giao thức đã được chứng minh truyền 10–15 km với năng lượng rất thấp — để giải quyết bài toán triển khai nơi không có WiFi."
- Chuyển tiếp: "Từ khoảng trống này, em xác định 5 mục tiêu cụ thể cho đề tài."

## 🖼️ Hình ảnh / Bảng biểu

- **Bảng:** So sánh 4 hệ thống (rút gọn từ Bảng 2.1 báo cáo)

| Tiêu chí | PAM Air | IQAir | PurpleAir | VN-AQI |
|-----------|---------|-------|-----------|--------|
| Cảm biến | PM2.5 | PM2.5, CO₂ | PM2.5, PM10 | Đầy đủ (FEM) |
| Truyền thông | WiFi/4G | WiFi | WiFi | Chuyên dụng |
| Chi phí/trạm | Trung bình | **Cao (~10tr)** | Trung bình | **Rất cao** |
| Mã nguồn mở | ❌ | ❌ | Một phần | ❌ |
| Hỗ trợ LoRa | ❌ | ❌ | ❌ | ❌ |

- **Caption:** So sánh hệ thống giám sát CLKK hiện có

## 📐 Bố cục đề xuất (bảng trung tâm)

```
┌──────────────────────────────────────────────────────┐
│  [Tiêu đề] Hạn chế của giải pháp hiện tại            │
├──────────────────────────────────────────────────────┤
│  • Không hệ thống nào đáp ứng đồng thời 4 tiêu chí  │
│  • WiFi/4G bắt buộc → hạn chế triển khai             │
│  • Mã nguồn đóng → không tùy biến                    │
├──────────────────────────────────────────────────────┤
│                                                      │
│  ┌──────────────────────────────────────────────┐    │
│  │  [BẢNG SO SÁNH 4 HỆ THỐNG — 5 cột, 6 dòng] │    │
│  │  Highlight hàng "LoRa": tất cả đều ❌         │    │
│  └──────────────────────────────────────────────┘    │
│                                                      │
├──────────────────────────────────────────────────────┤
│  Nguồn: Bảng 2.1 báo cáo                    (nhỏ)  │
└──────────────────────────────────────────────────────┘
```

## 🎨 Mẹo thiết kế

- Dòng **"Hỗ trợ LoRa"** highlight nền **đỏ nhạt** vì tất cả đều ❌ — đây là khoảng trống quan trọng nhất
- Dòng **"Mã nguồn mở"** cũng highlight nền nhạt hơn vì hầu hết đều ❌
- Dùng icon ❌ / ✅ thay vì text "Có/Không" để bảng dễ scan hơn
- 3 bullet trên cùng dùng **font lớn, bold keyword**, nền tối cho chữ trắng nổi bật
- Bảng chiếm **~55% diện tích slide**, bullet chiếm ~30%, tiêu đề + nguồn ~15%
- Có thể thêm 1 cột "Đề xuất" ở cuối bảng với tất cả ✅ nếu muốn tạo tương phản mạnh (tuỳ chọn)

## 📎 Nguồn tham chiếu

- File: `1_Gioi_thieu.tex`, Section: §1.2 (Mục tiêu và phạm vi đề tài)
- File: `2_Khao_sat.tex`, Section: §2.1 (Khảo sát hiện trạng)
- Bảng tham chiếu: `table:so_sanh_he_thong` (Bảng 2.1)
- Trích dẫn: `\cite{pamair2024}`, `\cite{iqair2024}`, `\cite{purpleair2024}`, `\cite{btnmt2023}`, `\cite{augustin2016}`
