# Slide 12: Giao diện Người dùng

## ✅ Nội dung HIỆN trên slide (3 bullet chính)

- **Dashboard realtime** — 6 thẻ thông số (AQI, PM2.5, PM10, CO₂, nhiệt độ, độ ẩm) + bản đồ AQI khu vực + biểu đồ lịch sử + khuyến nghị sức khỏe; tự động cập nhật qua Socket.IO
- **Bản đồ AQI (Leaflet)** — marker mã màu US EPA cho từng trạm; popup hiển thị tên trạm, AQI, PM2.5, thời gian cập nhật
- **Lịch sử & Xếp hạng** — biểu đồ ECharts theo giờ/ngày (truy vấn Continuous Aggregate); xếp hạng ô nhiễm sắp xếp theo AQI

## 🎤 Nội dung NÓI miệng khi trình bày

- Mở đầu: "Slide trước em đã trình bày cơ sở dữ liệu và cách tính AQI. Bây giờ em demo giao diện người dùng — nơi hiển thị kết quả của toàn bộ pipeline cho người dùng cuối."
- Giải thích Dashboard: "Khi người dùng truy cập trang chủ, hệ thống yêu cầu quyền vị trí GPS và ưu tiên hiển thị dữ liệu trạm đo gần nhất. Hàng đầu tiên là 6 thẻ thông số nổi bật, mỗi thẻ có viền màu cảnh báo tương ứng mức AQI. Bên dưới là bản đồ AQI khu vực cùng danh sách trạm lân cận. Nửa dưới là biểu đồ lịch sử và thẻ khuyến nghị sức khỏe. Tất cả dữ liệu cập nhật liên tục realtime qua Socket.IO — khi Gateway gửi dữ liệu mới, dashboard tự động cập nhật mà không cần tải lại trang."
- Giải thích Bản đồ: "Trang bản đồ hiển thị toàn bộ trạm đo trên Leaflet với tile OpenStreetMap. Mỗi trạm là marker hình tròn với mã màu AQI theo chuẩn US EPA. Nhấn vào marker sẽ hiện popup chi tiết gồm tên trạm, AQI, PM2.5 và thời gian cập nhật cuối."
- Giải thích Lịch sử & Xếp hạng: "Trang lịch sử cho phép chọn trạm, chọn thông số và chế độ hiển thị theo giờ hoặc theo ngày. Chế độ theo giờ truy vấn từ Continuous Aggregate hourly_measurements nên rất nhanh. Trang xếp hạng sắp xếp tất cả trạm theo AQI để người dùng so sánh nhanh."
- Lưu ý bổ sung: "Giao diện hỗ trợ responsive trên nhiều kích thước màn hình và đa ngôn ngữ Việt–Anh qua react-i18next. Hệ thống sử dụng 28 component tái sử dụng với dark theme thống nhất."
- Chuyển tiếp: "Đó là phần giao diện người dùng. Slide tiếp theo em sẽ trình bày giao diện quản trị dành cho admin."

## 🖼️ Hình ảnh / Bảng biểu

- **Hình chính:** `Hinhve/dashboard.png` — Dashboard chất lượng không khí
- **Hình phụ 1:** `Hinhve/ban_do_aqi.png` — Bản đồ AQI (Leaflet)
- **Hình phụ 2:** `Hinhve/lich_su.png` — Trang Lịch sử dữ liệu
- **Caption hình chính:** Dashboard realtime — 6 thẻ + bản đồ + biểu đồ

## 📐 Bố cục đề xuất (hình Dashboard lớn trên + 2 hình nhỏ dưới)

```
┌──────────────────────────────────────────────────────┐
│  [Tiêu đề] Giao diện Người dùng                     │
├──────────────────────────────────────────────────────┤
│                                                      │
│  [dashboard.png — chiếm 55% diện tích slide]         │
│                                                      │
├─────────────────────────┬────────────────────────────┤
│  📍 Bản đồ AQI          │  📈 Lịch sử & Xếp hạng    │
│  [ban_do_aqi.png nhỏ]   │  [lich_su.png nhỏ]        │
│  • Leaflet + mã màu     │  • ECharts giờ/ngày       │
│    US EPA               │  • Continuous Aggregate    │
│  • Popup chi tiết       │  • Xếp hạng theo AQI      │
├─────────────────────────┴────────────────────────────┤
│  🔄 Realtime: Socket.IO | 🌐 i18n: Việt–Anh  (nhỏ) │
└──────────────────────────────────────────────────────┘
```

## 🎨 Mẹo thiết kế

- Hình `dashboard.png` chiếm **phần trên ~55%** slide, hiển thị rõ 6 thẻ thông số với viền màu AQI nổi bật
- Hai hình phụ `ban_do_aqi.png` và `lich_su.png` xếp ngang **phần dưới**, mỗi hình chiếm ~45% chiều rộng kèm 2–3 keyword bên dưới
- Dòng footer nhỏ ở cuối nhấn mạnh hai tính năng nổi bật: **🔄 Realtime** (Socket.IO) và **🌐 Đa ngôn ngữ** (Việt–Anh)
- Dùng viền hoặc shadow nhẹ quanh mỗi screenshot để tạo cảm giác "window" ứng dụng thật
- Không cần bullet point riêng vì screenshot đã tự giải thích — chỉ cần keyword nhãn ngắn dưới mỗi hình

## 📎 Nguồn tham chiếu

- File: `4_Ket_qua_thuc_nghiem.tex`, Section: §4.3.3 (Minh họa các chức năng chính — Dashboard, Bản đồ AQI, Lịch sử, Xếp hạng)
- File: `4_Ket_qua_thuc_nghiem.tex`, Section: §4.2.3 (Thiết kế giao diện — 2 layout, 28 component, responsive, i18n)
- Hình tham chiếu: `fig:dashboard` (Dashboard), `fig:ban_do_aqi` (Bản đồ AQI), `fig:lich_su` (Lịch sử), `fig:xep_hang` (Xếp hạng)
