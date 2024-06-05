import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
  errorFormat: 'pretty',
});

prisma.$on('error', (e) => {
  console.error('Prisma Client Error:', e); // prisma 클라이언트 초기화 시 에러 핸들링 
});
