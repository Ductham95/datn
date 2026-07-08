# Slide 16: Đóng góp chính

## ✅ Nội dung HIỆN trên slide (4 bullet — mỗi đóng góp 1 dòng)

- **① Hệ thống IoT end-to-end** — 14.036 LOC, 4 miền kỹ thuật (Embedded C → Node.js → React), triển khai 1 lệnh `docker compose up`
- **② Giao thức LoRa binary 18 byte** — giảm air-time **11×** so với JSON; deduplication bằng `(nodeId, msgId)` → zero trùng lặp
- **③ Pipeline telemetry 3 bước** — Dedup → Transaction → Alert (ngoài transaction) → **zero data loss**; 44/44 test pass
- **④ Chi phí thấp + mã nguồn mở** — ~**875K VNĐ**/node (~36 USD), rẻ hơn IQAir **11×**; open-source toàn bộ 4 tầng

## 🎤 Nội dung NÓI miệng khi trình bày

- Mở đầu: "Từ kết quả thực nghiệm vừa trình bày, em xin tổng hợp bốn đóng góp kỹ thuật chính của đồ án."
- Đóng góp 1: "Đầu tiên, hệ thống tích hợp bốn miền kỹ thuật hoàn toàn khác nhau — phần cứng, firmware C/C++, backend Node.js, và frontend React — thành một hệ thống end-to-end hoạt động ổn định. Tổng quy mô khoảng 14 nghìn dòng mã, phát triển trong 4 tháng. Em áp dụng chiến lược contract-first: định nghĩa giao thức và schema giao tiếp giữa các tầng trước, rồi phát triển từ dưới lên. Triển khai production chỉ bằng một lệnh docker compose up."
- Đóng góp 2: "Thứ hai, giao thức LoRa binary 18 byte thay vì JSON 150–200 byte, giảm air-time 11 lần. Cơ chế deduplication bằng cặp khóa nodeId–msgId đảm bảo dữ liệu không bị trùng khi nhiều Gateway thu cùng một gói tin."
- Đóng góp 3: "Thứ ba, pipeline xử lý telemetry tách riêng bước lưu dữ liệu và bước cảnh báo. Lỗi ở bước cảnh báo không rollback dữ liệu đo — đảm bảo zero data loss. Module tính AQI được kiểm thử 19 unit test giá trị biên, tổng cộng 44/44 test case pass."
- Đóng góp 4: "Cuối cùng, chi phí mỗi Sensor Node chỉ khoảng 875 nghìn đồng, rẻ hơn IQAir 11 lần. Toàn bộ mã nguồn 4 tầng được công khai dưới giấy phép mã nguồn mở, cho phép cộng đồng tái sử dụng và mở rộng."
- Chuyển tiếp: "Slide tiếp theo em sẽ trình bày kết luận và hướng phát triển của đồ án."

## 🖼️ Hình ảnh / Bảng biểu

- **Bảng:** So sánh hệ thống đề xuất vs các giải pháp hiện có (rút gọn từ Bảng so_sanh_ket_qua trong báo cáo)

| Tiêu chí | **Hệ thống đề xuất** | PAM Air | IQAir | PurpleAir | VN-AQI |
|-----------|----------------------|---------|-------|-----------|--------|
| Đa thông số (6) | **✅** | ✅ | ❌ (1) | ❌ (1) | ✅ |
| Truyền LoRa | **✅** | ❌ | ❌ | ❌ | ❌ |
| Mã nguồn mở | **✅** | ❌ | ❌ | ❌ | ❌ |
| Chi phí/node | **~875K** | N/A | ~10M | ~6,5M | >100M |

- **Caption:** So sánh 4 tiêu chí khác biệt với các giải pháp hiện có

## 📐 Bố cục đề xuất (Bảng trung tâm + 4 icon-bullet)

```
┌──────────────────────────────────────────────────────┐
│  [Tiêu đề] Đóng góp chính                            │
├──────────────────────────────────────────────────────┤
│  🏗️ ① IoT end-to-end: 14.036 LOC, 4 miền kỹ thuật   │
│  📡 ② LoRa binary 18B: air-time ↓11×, dedup          │
│  ⚙️ ③ Pipeline 3 bước: zero data loss, 44/44 test    │
│  💰 ④ ~875K VNĐ/node, open-source toàn bộ            │
├──────────────────────────────────────────────────────┤
│  [Bảng so sánh 5 cột — hệ thống đề xuất highlight]  │
│  Tiêu chí | Đề xuất | PAM | IQAir | PurpleAir | VN  │
│  Đa thông số |  ✅  |  ✅  |  ❌  |    ❌    |  ✅  │
│  LoRa        |  ✅  |  ❌  |  ❌  |    ❌    |  ❌  │
│  Open-source |  ✅  |  ❌  |  ❌  |    ❌    |  ❌  │
│  Chi phí     | 875K | N/A | 10M  |   6,5M   | >100M│
├──────────────────────────────────────────────────────┤
│  Nguồn: Chương 5 — Giải pháp và đóng góp             │
└──────────────────────────────────────────────────────┘
```

## 🎨 Mẹo thiết kế

- Mỗi đóng góp dùng **icon + số thứ tự** (①②③④) để dễ theo dõi, mỗi dòng có 1 keyword bold + 1 số liệu highlight
- Số **14.036**, **11×**, **875K** dùng cỡ lớn, bold, màu xanh dương hoặc vàng nổi bật trên nền tối
- Bảng so sánh: cột "Hệ thống đề xuất" highlight nền xanh lá nhạt hoặc viền đậm để nhấn mạnh ✅ toàn bộ 4 dòng
- Các ô ❌ dùng màu xám mờ, ✅ dùng màu xanh lá đậm → tạo contrast rõ ràng
- Giữ style nhất quán với slide 15: dark theme, keyword ngắn gọn, số liệu nổi bật

## 📎 Nguồn tham chiếu

- File: `5_Giai_phap_dong_gop.tex`, Section: §5.1–§5.4
- §5.1: Hệ thống IoT đa tầng end-to-end — 14.036 LOC, 4 miền kỹ thuật, contract-first
- §5.2: Giao thức LoRa binary 18B — air-time giảm 11×, dedup bằng `(nodeId, msgId)`
- §5.3: Pipeline telemetry 3 bước — zero data loss, 44/44 test, Continuous Aggregate
- §5.4: Chi phí thấp ~875K VNĐ/node (~36 USD), rẻ hơn IQAir 11×, open-source toàn bộ
- Bảng tham chiếu: `table:so_sanh_ket_qua`, `table:bom_cost`, `table:req_mapping`
