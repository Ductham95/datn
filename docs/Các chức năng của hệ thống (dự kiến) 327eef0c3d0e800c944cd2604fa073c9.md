# Các chức năng của hệ thống (dự kiến)

## Cho người dùng:

1. Dựa vào vị trí của người dùng để gợi ý trạm gần nhất
2. Dashboard hiển thị các thông số AQI, PM2.5, PM10, CO2, TVOC, Nhiệt độ, độ ẩm → **Cảnh báo sức khỏe**: So sánh với hướng dẫn WHO (ví dụ "PM2.5 cao gấp 6.8 lần") + khuyến nghị cho nhóm nhạy cảm.
3. **Thời tiết hiện tại + Dự báo**: Nhiệt độ, tốc độ gió, hướng gió, độ ẩm. (có thể gọi API free ở đâu đó)
4. Xem lịch sử:
    1. chế độ xem **Giờ / Ngày**.
    2. Xem lịch sử theo từng thông số: **AQI⁺, PM2.5, PM10, CO2, TVOC, nhiệt độ, độ ẩm**
    3. **Biểu đồ cột** lịch sử theo thời gian.
    4. **Bản đồ AQI** khu vực với các trạm đo đánh dấu bằng mã màu.
5. Bản đồ
    1. Bản đồ AQI toàn khu vực, các trạm hiển thị bằng chấm màu + số AQI.
6. Xếp hạng các vị trí ô nhiễm

## Cho người quản trị:

1. **Quản lý thiết bị (Sensor Nodes & Gateways)**
    1. Thêm mới, cập nhật thông tin vị trí, cấu hình hoặc xóa thiết bị (Gateway, Sensor Node).
    2. Giám sát trạng thái thiết bị: Theo dõi tình trạng online/offline, thời gian gửi dữ liệu cuối cùng (Last seen) của Gateway và các Sensor Node.
    3. Xem thông tin chi tiết: ID thiết bị, cấp độ tín hiệu kết nối mạng (LoRa RSII, WiFi), và vị trí lắp đặt thực tế.

2. **Giám sát tình trạng mạng và phần cứng (Health Monitoring)**
    1. Giám sát sự ổn định của phần cứng và các cảm biến đo lường (PMS7003, CCS811,...).
    2. Cảnh báo sự cố: Nhận thông báo khi Node mất kết nối với Gateway (lỗi tín hiệu LoRa) hoặc Gateway mất kết nối với Cloud (lỗi WiFi/Server).
    3. Theo dõi tình trạng nguồn điện/pin của thiết bị (nếu áp dụng với khu vực độc lập).

3. **Quản lý dữ liệu và Xuất báo cáo**
    1. Xem, tìm kiếm và phân tích lịch sử dữ liệu thô chuyên sâu từ Database lưu trữ.
    2. Xuất dữ liệu (Export Data): Khả năng trích xuất dữ liệu ra tệp CSV, Excel theo trạm, theo thời gian chỉ định phục vụ nghiên cứu.
    3. Xem báo cáo thống kê tỷ lệ truyền nhận dữ liệu thành công (packet loss trong mạng LoRa) và uptime (thời gian hoạt động bình thường) của thiết bị.

4. **Cấu hình hệ thống (System Configuration)**
    1. Thiết lập lại các ngưỡng cảnh báo đo lường (chỉ số chuẩn về PM2.5, AQI) trong Server/Dashboard.
    2. Thiết lập cấu hình hệ thống bao gồm chu kỳ gửi dữ liệu (sampling rate) cho các trạm lấy mẫu nếu ứng dụng cho phép gửi lệnh điều khiển.

5. **Quản lý tài khoản (User/Admin Management)**
    1. Phân quyền và cấp tài khoản cho các quản trị viên khác hoặc người dùng nội bộ để truy cập các chức năng nâng cao.
    2. Xem log hệ thống của phần mềm quản lý: Lưu vết sửa/xóa/cấu hình của những người quản trị khác.