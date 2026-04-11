# Prisma Schema — ORM Configuration

## Tổng quan

Dự án sử dụng **Prisma ORM** (v7.5) để tương tác với PostgreSQL. Prisma schema định nghĩa models tương ứng với các bảng trong database.

File: [`backend/prisma/schema.prisma`](../../backend/prisma/schema.prisma)

---

## Cấu hình

### Generator

```prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["postgresqlExtensions"]
}
```

`postgresqlExtensions` là preview feature cho phép Prisma nhận biết các extension PostgreSQL.

### Datasource

```prisma
datasource db {
  provider   = "postgresql"
  extensions = [timescaledb, postgis, uuid_ossp(map: "uuid-ossp")]
}
```

Khai báo 3 extension sử dụng:
- **timescaledb**: Hypertable, Continuous Aggregates
- **postgis**: Kiểu `GEOMETRY` cho tọa độ
- **uuid-ossp**: Hàm `uuid_generate_v4()` tạo UUID

---

## Models

### User

```prisma
model User {
  id            String   @id @default(dbgenerated("uuid_generate_v4()")) @db.Uuid
  username      String   @unique @db.VarChar(100)
  password_hash String   @db.VarChar(255)
  role          String   @default("user") @db.VarChar(20)
  created_at    DateTime @default(now()) @db.Timestamptz()

  @@map("users")
}
```

### Gateway

```prisma
model Gateway {
  id            String       @id @db.VarChar(50)
  name          String       @db.VarChar(100)
  location_desc String?      @db.VarChar(255)
  status        String       @default("offline") @db.VarChar(20)
  last_seen     DateTime?    @db.Timestamptz()
  sensor_nodes  SensorNode[]

  @@map("gateways")
}
```

### SensorNode

```prisma
model SensorNode {
  id            String                               @id @db.VarChar(50)
  gateway_id    String?                              @db.VarChar(50)
  name          String                               @db.VarChar(100)
  geom          Unsupported("geometry(Point,4326)")?
  status        String                               @default("active") @db.VarChar(20)
  battery_level Int                                  @default(100)
  lora_rssi     Int?
  last_seen     DateTime?                            @db.Timestamptz()

  gateway Gateway? @relation(fields: [gateway_id], references: [id], onDelete: Cascade)

  @@map("sensor_nodes")
}
```

> [!NOTE]
> Cột `geom` dùng `Unsupported()` vì Prisma chưa hỗ trợ native cho kiểu PostGIS. Các truy vấn geospatial cần dùng `$queryRaw` hoặc `$executeRaw`.

### Measurement

```prisma
model Measurement {
  time        DateTime @db.Timestamptz()
  node_id     String   @db.VarChar(50)
  pm25        Float?
  pm10        Float?
  co2         Int?
  tvoc        Int?
  temperature Float?
  humidity    Float?

  @@id([time, node_id])
  @@map("measurements")
}
```

> [!IMPORTANT]
> Bảng `measurements` là **TimescaleDB Hypertable** — nhưng Hypertable, Retention Policy, và Continuous Aggregate được thiết lập qua file `init.sql`, không thông qua Prisma migration. Xem [Schema Design](schema-design.md) để biết chi tiết.

---

## Sử dụng Prisma Client

### Import

```javascript
const prisma = require('./config/prismaClient');
```

### Ví dụ truy vấn

```javascript
// Lấy tất cả gateways
const gateways = await prisma.gateway.findMany({
  include: { sensor_nodes: true }
});

// Lưu measurement
await prisma.measurement.create({
  data: { time: new Date(), node_id: 'NODE_001', pm25: 12.5, ... }
});

// Truy vấn PostGIS (raw SQL)
const nearest = await prisma.$queryRaw`
  SELECT id, name, ST_Distance(geom, ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326), true) as distance
  FROM sensor_nodes
  ORDER BY geom <-> ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)
  LIMIT 1
`;
```

---

## Prisma CLI Commands

```bash
# Generate Prisma Client (sau khi sửa schema)
npx prisma generate

# Introspect database hiện tại → cập nhật schema
npx prisma db pull

# Push schema changes lên DB (không tạo migration)
npx prisma db push

# Mở Prisma Studio (GUI browser)
npx prisma studio
```
