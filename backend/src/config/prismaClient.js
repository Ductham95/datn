const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

// Tạo pg Pool (driver adapter cho Prisma v7)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Tạo Prisma adapter từ pg Pool
const adapter = new PrismaPg(pool);

// Khởi tạo Prisma Client với adapter
const prisma = new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'warn', 'error'] 
    : ['warn', 'error'],
});

module.exports = prisma;
