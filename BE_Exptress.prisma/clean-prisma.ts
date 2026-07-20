// clean-prisma.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Prisma 유령 마이그레이션 기록 청소 시작...');
  
  // ⭐️ 실제 데이터는 건드리지 않고, 오직 기록용 테이블만 완전히 비웁니다!
  await prisma.$executeRawUnsafe('TRUNCATE TABLE _prisma_migrations;');
  
  console.log('✨ 청소 완료! 이제 마이그레이션을 진행할 수 있습니다.');
}

main()
  .catch((e) => console.error('❌ 에러 발생:', e))
  .finally(async () => await prisma.$disconnect());