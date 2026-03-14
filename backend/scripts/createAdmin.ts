// 创建管理员账号脚本
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    console.log('🔐 开始创建管理员账号...\n');

    const username = '666';
    const password = '666666';
    const email = 'admin@livetrip.com';

    // 检查用户名是否已存在
    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      console.log('⚠️  用户名已存在，更新为管理员角色...');
      
      await prisma.user.update({
        where: { username },
        data: {
          role: 'admin',
          email: email,
        },
      });
      
      console.log(`✅ 管理员账号已更新: ${username}`);
      console.log(`   邮箱: ${email}`);
      console.log(`   角色: admin`);
    } else {
      // 加密密码
      const passwordHash = await bcrypt.hash(password, 10);

      // 创建管理员用户
      const admin = await prisma.user.create({
        data: {
          username,
          email,
          passwordHash,
          role: 'admin',
          avatar: '',
        },
      });

      console.log('✅ 管理员账号创建成功！');
      console.log(`   用户名: ${username}`);
      console.log(`   密码: ${password}`);
      console.log(`   邮箱: ${email}`);
      console.log(`   用户ID: ${admin.id}`);
    }

    await prisma.$disconnect();
    console.log('\n✅ 完成！');
  } catch (error) {
    console.error('❌ 创建管理员账号失败:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

// 执行脚本
createAdmin();
