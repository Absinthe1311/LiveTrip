// 测试Blog API和数据库连接
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testBlogAPI() {
  try {
    console.log('🔍 开始测试Blog功能...\n');

    // 1. 检查数据库连接
    console.log('1️⃣ 检查数据库连接...');
    await prisma.$connect();
    console.log('✅ 数据库连接成功\n');

    // 2. 查询所有博客
    console.log('2️⃣ 查询所有博客...');
    const allBlogs = await prisma.blogPost.findMany({
      include: {
        likes: true,
        comments: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log(`📊 数据库中共有 ${allBlogs.length} 篇博客\n`);

    if (allBlogs.length > 0) {
      console.log('📝 博客列表：');
      allBlogs.forEach((blog, index) => {
        console.log(`\n--- 博客 ${index + 1} ---`);
        console.log(`ID: ${blog.id}`);
        console.log(`标题: ${blog.title}`);
        console.log(`作者ID: ${blog.userId}`);
        console.log(`城市: ${blog.city || '未设置'}`);
        console.log(`标签: ${blog.tags || '无'}`);
        console.log(`发布状态: ${blog.isPublished ? '已发布' : '草稿'}`);
        console.log(`点赞数: ${blog.likeCount}`);
        console.log(`评论数: ${blog.commentCount}`);
        console.log(`浏览数: ${blog.viewCount}`);
        console.log(`创建时间: ${blog.createdAt}`);
        console.log(`内容预览: ${blog.content.substring(0, 100)}...`);
      });
    } else {
      console.log('⚠️  数据库中没有博客数据');
      console.log('💡 建议：创建一些测试博客数据\n');
    }

    // 3. 查询用户
    console.log('\n3️⃣ 查询用户...');
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
      },
    });
    console.log(`👥 数据库中共有 ${users.length} 个用户`);
    if (users.length > 0) {
      console.log('用户列表：');
      users.forEach(user => {
        console.log(`  - ${user.username} (${user.email}) - ID: ${user.id}`);
      });
    }

    // 4. 测试API端点
    console.log('\n4️⃣ 测试API端点...');
    console.log('API端点列表：');
    console.log('  - GET    /api/blogs          - 获取博客列表');
    console.log('  - POST   /api/blogs          - 创建博客');
    console.log('  - GET    /api/blogs/:id      - 获取博客详情');
    console.log('  - PUT    /api/blogs/:id      - 更新博客');
    console.log('  - DELETE /api/blogs/:id      - 删除博客');
    console.log('  - POST   /api/blogs/:id/like - 点赞/取消点赞');

    console.log('\n✅ 测试完成！');

    if (allBlogs.length === 0) {
      console.log('\n💡 下一步操作：');
      console.log('1. 启动后端服务：npm run dev');
      console.log('2. 访问前端页面创建博客');
      console.log('3. 或使用API工具（如Postman）创建测试数据');
    }

  } catch (error) {
    console.error('❌ 测试失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testBlogAPI();
