# Slide 08: Giao thức LoRa Binary 18 byte

## ✅ Nội dung HIỆN trên slide (3 bullet + 1 bảng cấu trúc gói tin)

- **18 byte binary vs ~200 byte JSON** — giảm air-time LoRa ~11 lần, tăng thông lượng kênh truyền
- **Cấu trúc packed struct C** — Header 3B (nodeId + pktType + msgId) + Payload 14B (7 trường cảm biến) + Battery 1B
- **Deduplication bằng msgId** — cặp khóa (nodeId, msgId) lọc gói tin trùng khi nhiều Gateway cùng nhận

| Trường | Kích thước | Mô tả |
|--------|-----------|-------|
| nodeId | 1B | ID node (1–255) |
| pktType | 1B | Loại gói: data / heartbeat |
| msgId | 1B | Bộ đếm tuần hoàn 0–255 |
| PM1, PM2.5, PM10 | 3×2B | Giá trị ×10, unsigned |
| eCO₂, eTVOC | 2×2B | Đơn vị ppm / ppb |
| Nhiệt độ | 2B | Giá trị ×10, signed |
| Độ ẩm | 2B | Giá trị ×10, unsigned |
| Battery | 1B | 0–100% |

## 🎤 Nội dung NÓI miệng khi trình bày

- Mở đầu: "Slide trước em đã trình bày phần cứng, bây giờ em trình bày cách dữ liệu từ các cảm biến được đóng gói và truyền qua LoRa."
- Giải thích bài toán: "LoRa là kênh truyền băng thông hẹp, air-time tỷ lệ thuận với kích thước gói tin. Nếu dùng JSON như giao tiếp Gateway–Backend thì mỗi gói tin sẽ khoảng 150–200 byte, kéo dài air-time và tăng nguy cơ va chạm gói tin. Em thiết kế giao thức binary chỉ 18 byte, giảm air-time khoảng 11 lần."
- Giải thích kỹ thuật nhân 10: "Các giá trị số thực như nhiệt độ 32.5°C được nhân 10 thành 325, lưu dạng integer 2 byte. Cách này loại bỏ hoàn toàn floating-point khỏi gói tin mà vẫn giữ một chữ số thập phân. Giá trị sentinel 0xFFFF đánh dấu cảm biến bị lỗi đọc."
- Giải thích deduplication: "Trong mô hình Hub-Spoke, vùng phủ sóng của hai Gateway có thể chồng lấp — cùng một gói tin được nhiều Gateway nhận. Trường msgId là bộ đếm tuần hoàn 0–255, Backend dùng cặp khóa (nodeId, msgId) trong bộ nhớ đệm để lọc trùng trước khi ghi vào cơ sở dữ liệu."
- Nhấn mạnh kết quả: "Thử nghiệm khoảng cách truyền LoRa trong không gian thoáng đạt 800 mét — đủ để một Gateway phục vụ nhiều Sensor Node trong bán kính triển khai thực tế."
- Chuyển tiếp: "Slide tiếp theo em sẽ trình bày chi tiết firmware Sensor Node với cơ chế Deep-sleep và firmware Gateway với kiến trúc superloop."

## 🖼️ Hình ảnh / Bảng biểu

- **Hình:** `Hinhve/packet_lora.png`
- **Bảng:** Bảng cấu trúc gói tin LoRa (markdown ở trên) — rút gọn từ mô tả struct trong §4.2.2
- **Caption:** Cấu trúc gói tin LoRa 18 byte

## 📐 Bố cục đề xuất (2 cột: bullet + bảng trái, hình minh họa phải)

```
┌──────────────────────────────────────────────────────┐
│  [Tiêu đề] Giao thức LoRa Binary 18 byte             │
├────────────────────────┬─────────────────────────────┤
│                        │                             │
│  • 18B binary vs       │  [Hình packet_lora.png]     │
│    ~200B JSON          │                             │
│    → giảm air-time 11× │  Cấu trúc gói tin LoRa     │
│                        │                             │
│  • Packed struct C:    │  ┌─────┬─────┬─────┐       │
│    Header 3B +         │  │nodeId│pktTy│msgId│       │
│    Payload 14B +       │  │ 1B  │ 1B  │ 1B  │       │
│    Battery 1B          │  ├─────┴─────┴─────┤       │
│                        │  │   Sensor Data   │       │
│  • Dedup: (nodeId,     │  │     14 byte     │       │
│    msgId) → lọc trùng  │  ├─────────────────┤       │
│                        │  │  Battery  1B    │       │
│                        │  └─────────────────┘       │
│                        │                             │
├────────────────────────┴─────────────────────────────┤
│  Nguồn: §4.2.2, §5.2 báo cáo                 (nhỏ) │
└──────────────────────────────────────────────────────┘
```

Lưu ý: Nếu hình `packet_lora.png` đã đủ rõ ràng, có thể bỏ bảng markdown trên slide và chỉ hiện 3 bullet + hình. Bảng md dùng cho backup / thuyết minh chi tiết.

## 🎨 Mẹo thiết kế

- Bold con số **18 byte** và **~11×** cỡ lớn, dùng màu xanh dương đậm để nhấn mạnh hiệu quả
- So sánh **18B vs ~200B** dùng biểu đồ thanh ngang nhỏ (bar) ngay trên slide để trực quan hóa sự chênh lệch
- Bảng cấu trúc gói tin dùng **mã màu 3 vùng**: Header (xanh dương), Payload (xanh lá), Battery (cam) — tương ứng với hình `packet_lora.png`
- Trường `msgId` highlight bằng **viền đỏ** hoặc **icon khóa 🔑** để nhấn mạnh vai trò deduplication
- Font monospace cho tên trường kỹ thuật (`nodeId`, `pktType`, `msgId`)

## 📎 Nguồn tham chiếu

- File: `4_Ket_qua_thuc_nghiem.tex`, Section: §4.2.2 (Thiết kế firmware — cấu trúc gói tin LoRa)
- File: `5_Giai_phap_dong_gop.tex`, Section: §5.2 (Thiết kế giao thức LoRa binary và cơ chế chống trùng lặp)
- Hình tham chiếu: `fig:packet_lora` (Hình cấu trúc gói tin LoRa)
