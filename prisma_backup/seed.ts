/**
 * 数据库种子数据
 * 创建管理员账号等初始数据
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 开始执行种子数据...');

  // 删除所有现有的管理员账号
  const deletedAdmins = await prisma.user.deleteMany({
    where: { role: 'admin' },
  });
  console.log(`✅ 已删除 ${deletedAdmins.count} 个旧管理员账号`);

  // 创建新的管理员账号
  const passwordHash = await bcrypt.hash('666666', 10);

  const admin = await prisma.user.create({
    data: {
      username: '666',
      email: '666@666.com',
      passwordHash: passwordHash,
      role: 'admin',
      avatar: '',
    },
  });

  console.log('✅ 管理员账号创建成功:', {
    id: admin.id,
    username: admin.username,
    email: admin.email,
    role: admin.role,
  });

  console.log('🎉 种子数据执行完成！');
}

main()
  .catch((e) => {
    console.error('❌ 种子数据执行失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
