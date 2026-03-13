const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createAdminAccount() {
  try {
    console.log('🔄 开始创建管理员账号...');

    // 检查是否已存在admin用户
    const existingUser = await prisma.user.findUnique({
      where: { username: 'admin' },
    });

    if (existingUser) {
      console.log('⚠️  发现已存在的admin用户，正在删除...');
      await prisma.user.delete({
        where: { username: 'admin' },
      });
      console.log('✅ 已删除旧的admin用户');
    }

    // 加密密码
    const passwordHash = await bcrypt.hash('111111', 10);
    console.log('✅ 密码加密完成');

    // 创建管理员账号
    const admin = await prisma.user.create({
      data: {
        username: 'admin',
        email: 'admin@livetrip.com',
        passwordHash: passwordHash,
        avatar: '',
        role: 'admin',
      },
    });

    console.log('✅ 管理员账号创建成功！');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('👤 用户名: admin');
    console.log('🔑 密码: 111111');
    console.log('🎭 角色: admin');
    console.log('📧 邮箱: admin@livetrip.com');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 您现在可以使用此账号登录系统！');

  } catch (error) {
    console.error('❌ 创建管理员账号失败:', error);
  } finally {
    await prisma.$disconnect();
    console.log('🔌 数据库连接已关闭');
  }
}

// 执行创建管理员账号
createAdminAccount();
