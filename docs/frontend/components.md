# Frontend Components — Thư viện UI Components

## Tổng quan

Thư viện gồm **10 UI components** tái sử dụng, xây dựng bằng CSS Modules với Design Tokens.

---

## 1. Button

Nút bấm đa năng với nhiều variants.

```jsx
<Button variant="primary" icon={Plus} size="md" loading={false}>
  Thêm Gateway
</Button>
```

| Prop | Type | Default | Mô tả |
|---|---|---|---|
| `variant` | `primary \| secondary \| ghost \| danger` | `primary` | Kiểu nút |
| `size` | `sm \| md \| lg` | `md` | Kích thước |
| `icon` | Component | — | Icon bên trái |
| `iconRight` | Component | — | Icon bên phải |
| `loading` | boolean | `false` | Hiện spinner |
| `fullWidth` | boolean | `false` | Full width |

---

## 2. DataTable

Bảng dữ liệu với sort, search, pagination.

```jsx
<DataTable
  columns={[
    { key: 'name', label: 'Tên', sortable: true },
    { key: 'status', label: 'Trạng thái', render: (v) => <Badge>{v}</Badge> }
  ]}
  data={gateways}
  searchPlaceholder="Tìm gateway..."
  searchKeys={['name', 'location']}
  actions={(row) => (
    <>
      <Button size="sm" variant="ghost" icon={Edit2} onClick={() => edit(row)} />
      <Button size="sm" variant="ghost" icon={Trash2} onClick={() => del(row)} />
    </>
  )}
  toolbar={<Button icon={Plus}>Thêm</Button>}
/>
```

| Prop | Type | Mô tả |
|---|---|---|
| `columns` | `{key, label, sortable?, render?, width?}[]` | Cấu hình cột |
| `data` | Array | Dữ liệu |
| `searchPlaceholder` | string | Placeholder ô tìm kiếm |
| `searchKeys` | string[] | Chỉ tìm trong các key này |
| `actions` | `(row) => JSX` | Render cột thao tác |
| `toolbar` | JSX | Nội dung toolbar (nút thêm...) |
| `pageSize` | number | Số dòng/trang (default: 10) |
| `emptyTitle` | string | Tiêu đề khi không có dữ liệu |

---

## 3. Card

Container card với header tùy chọn.

```jsx
<Card title="Bản đồ AQI" icon={MapIcon} padding="md">
  <AQIMap stations={stations} />
</Card>
```

---

## 4. Modal

Dialog overlay.

```jsx
<Modal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  title="Thêm Gateway"
  footer={
    <>
      <Button variant="secondary" onClick={close}>Hủy</Button>
      <Button onClick={save} loading={saving}>Lưu</Button>
    </>
  }
>
  <Input label="Tên" value={name} onChange={setName} />
</Modal>
```

---

## 5. Badge

Nhãn trạng thái.

```jsx
<Badge variant="success">Online</Badge>
<Badge variant="danger">Offline</Badge>
<Badge variant="warning">Warning</Badge>
```

Variants: `default`, `success`, `warning`, `danger`, `info`

---

## 6. Select

Dropdown select.

```jsx
<Select
  options={[
    { value: 'all', label: 'Tất cả' },
    { value: 'warning', label: 'Cảnh báo' }
  ]}
  value={filter}
  onChange={setFilter}
  icon={Filter}
/>
```

---

## 7. EmptyState

Placeholder khi không có dữ liệu.

```jsx
<EmptyState
  icon={FileText}
  title="Chưa có nhật ký nào"
  description="Nhật ký sẽ xuất hiện khi có hoạt động"
/>
```

---

## 8. Pagination

Điều khiển phân trang.

```jsx
<Pagination
  currentPage={page}
  totalPages={totalPages}
  onPageChange={setPage}
/>
```

---

## 9. Input

Form input field.

```jsx
<Input
  label="Tên Gateway"
  type="text"
  value={name}
  onChange={setName}
  placeholder="Nhập tên..."
  required
/>
```

---

## 10. Spinner

Loading indicators.

```jsx
<Spinner size={24} />
<PageLoader />       {/* Full-page loader */}
<CardSkeleton />     {/* Card skeleton placeholder */}
```

---

## AQIBadge (Common)

Badge hiển thị AQI value + mức cảnh báo.

```jsx
<AQIBadge value={154} size="sm" lang="vi" />
// Render: [154 Không tốt] (màu đỏ)
```

## MetricCard (Common)

Card hiển thị một metric.

```jsx
<MetricCard
  label="PM2.5"
  value={60.5}
  unit="µg/m³"
  icon={Wind}
  color="#F97316"
  bgColor="#FFF7ED"
/>
```
