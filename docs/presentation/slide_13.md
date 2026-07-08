# Slide 13: Giao diện Quản trị

## ✅ Nội dung HIỆN trên slide (3 bullet chính)

- **Admin Dashboard** — tổng quan hệ thống: số Sensor Node/Gateway online, cảnh báo chờ xử lý, AQI trung bình, uptime; biểu đồ AQI theo trạm realtime + cảnh báo gần đây + audit log
- **Giám sát cảnh báo** — 2 loại: vượt ngưỡng (threshold) & mất kết nối (connectivity); lọc theo mức độ, xác nhận (acknowledge), thông báo realtime qua Socket.IO
- **Quản lý thiết bị & Cấu hình** — CRUD Gateway/Sensor Node (cascade delete); cấu hình ngưỡng warn/danger cho 5 thông số (PM2.5, PM10, CO₂, TVOC, nhiệt độ); xuất CSV, quản lý tài khoản, nhật ký hệ thống

## 🎤 Nội dung NÓI miệng khi trình bày

- Mở đầu: "Slide trước em đã trình bày giao diện người dùng. Bây giờ em trình bày giao diện quản trị — dành cho admin quản lý toàn bộ hệ thống."
- Giải thích Admin Dashboard: "Khi admin đăng nhập, trang Tổng quan hiển thị bức tranh toàn cảnh: số thiết bị đang hoạt động, số cảnh báo chờ xử lý, AQI trung bình và uptime. Bên trái là biểu đồ AQI theo trạm realtime, bên phải tổng hợp cảnh báo gần đây và nhật ký hoạt động — giúp admin nắm bắt nhanh tình hình mà không cần điều hướng qua nhiều trang."
- Giải thích Cảnh báo: "Hệ thống tự động tạo cảnh báo khi dữ liệu vượt ngưỡng cấu hình hoặc thiết bị mất kết nối. Admin có thể lọc theo mức độ, xác nhận đã xử lý. Cảnh báo mới được phát realtime qua Socket.IO — hiển thị tức thì trên Admin Dashboard mà không cần refresh."
- Giải thích Quản lý thiết bị: "Admin có thể thêm, sửa, xóa Gateway và Sensor Node. Xóa Gateway sẽ cascade xóa tất cả Sensor Node con. Mọi thao tác quản trị đều được ghi vào Audit Log — ai đã làm gì, lúc nào, từ IP nào."
- Giải thích Cấu hình: "Trang cấu hình cho phép admin thiết lập ngưỡng cảnh báo warn và danger cho 5 thông số, cùng chu kỳ lấy mẫu. Admin cũng có thể xuất dữ liệu CSV và quản lý tài khoản phân quyền admin/user."
- Chuyển tiếp: "Vậy là em đã trình bày xong toàn bộ giao diện hệ thống. Slide tiếp theo em sẽ trình bày kết quả kiểm thử và triển khai."

## 🖼️ Hình ảnh / Bảng biểu

- **Hình chính:** `Hinhve/dashboard_quan_tri.png` — Dashboard tổng quan quản trị hệ thống
- **Hình phụ 1:** `Hinhve/giam_sat_canh_bao.png` — Giao diện giám sát cảnh báo
- **Hình phụ 2:** `Hinhve/quan_ly_thiet_bi.png` — Giao diện quản lý thiết bị
- **Caption hình chính:** Admin Dashboard — tổng quan + cảnh báo + audit log

## 📐 Bố cục đề xuất (hình Admin Dashboard lớn trên + 2 hình nhỏ dưới)

```
┌──────────────────────────────────────────────────────┐
│  [Tiêu đề] Giao diện Quản trị                       │
├──────────────────────────────────────────────────────┤
│                                                      │
│  [dashboard_quan_tri.png — chiếm 55% diện tích]      │
│                                                      │
├─────────────────────────┬────────────────────────────┤
│  🔔 Giám sát cảnh báo   │  ⚙️ Quản lý & Cấu hình    │
│  [giam_sat_canh_bao.png] │  [quan_ly_thiet_bi.png]   │
│  • 2 loại: threshold     │  • CRUD Gateway/Node      │
│    + connectivity        │  • Ngưỡng warn/danger     │
│  • Acknowledge + lọc     │  • Xuất CSV, Audit Log    │
├─────────────────────────┴────────────────────────────┤
│  🔐 JWT + bcrypt | 📋 Audit Log mọi thao tác (nhỏ)  │
└──────────────────────────────────────────────────────┘
```

## 🎨 Mẹo thiết kế

- Hình `dashboard_quan_tri.png` chiếm **phần trên ~55%**, hiển thị rõ sidebar AdminLayout bên trái và các card tổng quan
- Hai hình phụ xếp ngang **phần dưới**, mỗi hình ~45% chiều rộng kèm 2–3 keyword
- Dòng footer nhỏ nhấn mạnh **bảo mật** (JWT + bcrypt) và **truy vết** (Audit Log) — hai điểm khác biệt so với giao diện User
- Giữ style nhất quán với slide 12: viền/shadow quanh screenshot, keyword ngắn dưới mỗi hình
- Có thể dùng icon khóa 🔐 cho bảo mật và icon clipboard 📋 cho audit log

## 📎 Nguồn tham chiếu

- File: `4_Ket_qua_thuc_nghiem.tex`, Section: §4.3.3 (Minh họa các chức năng chính — Admin Dashboard, giám sát cảnh báo, quản lý thiết bị, cấu hình, xuất CSV, nhật ký, quản lý tài khoản)
- File: `4_Ket_qua_thuc_nghiem.tex`, Section: §4.2.3 (Thiết kế giao diện — AdminLayout với sidebar)
- File: `4_Ket_qua_thuc_nghiem.tex`, Section: §4.2.4 (alertService — cooldown 15 phút, 2 loại cảnh báo)
- Hình tham chiếu: `fig:dashboard_quan_tri` (Admin Dashboard), `fig:giam_sat_canh_bao` (Giám sát cảnh báo), `fig:quan_ly_thiet_bi` (Quản lý thiết bị), `fig:cau_hinh` (Cấu hình ngưỡng), `fig:nhat_ky_he_thong` (Nhật ký), `fig:quan_ly_tai_khoan` (Quản lý tài khoản), `fig:xuat_csv` (Xuất CSV)
