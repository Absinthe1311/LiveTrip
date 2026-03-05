// 测试 Home.tsx 登录态/未登录态功能
// 在浏览器控制台中运行此脚本

console.log('=== Home.tsx 登录态/未登录态测试 ===\n');

// 测试1：检查未登录态
console.log('测试1：未登录态');
localStorage.removeItem('user');
localStorage.removeItem('token');
console.log('✅ 已清除 localStorage 中的用户数据');
console.log('📋 当前登录状态：', localStorage.getItem('user') ? '已登录' : '未登录');
console.log('🌐 请刷新页面，应该看到未登录态的营销页面（Hero、核心特色、热门目的地）\n');

// 测试2：模拟登录
console.log('测试2：模拟登录');
const testUser = {
    id: '1',
    username: '测试用户',
    email: 'test@example.com'
};
localStorage.setItem('user', JSON.stringify(testUser));
localStorage.setItem('token', 'test-token-123456');
console.log('✅ 已设置 localStorage 中的用户数据');
console.log('👤 用户信息：', JSON.parse(localStorage.getItem('user')));
console.log('📋 当前登录状态：', localStorage.getItem('user') ? '已登录' : '未登录');
console.log('🌐 请刷新页面，应该看到已登录态的工作台视图（欢迎区域、创建新行程、我的行程、数据概览、热门目的地）\n');

// 测试3：检查 API 调用
console.log('测试3：检查 API 端点');
console.log('📡 前端将尝试调用以下 API：');
console.log('   - GET /api/trips (获取用户行程列表)');
console.log('   - GET /api/favorites/count (获取收藏数量)');
console.log('🔗 后端地址：', import.meta.env?.VITE_API_BASE_URL || 'http://localhost:3003/api');
console.log('');

// 测试4：测试响应式布局
console.log('测试4：响应式布局');
console.log('📱 请调整浏览器窗口大小：');
console.log('   - 大屏幕（>992px）：左右两栏布局（左60%，右40%）');
console.log('   - 中等屏幕（768-992px）：左右两栏布局');
console.log('   - 小屏幕（<768px）：单列布局（左栏在上，右栏在下）');
console.log('');

console.log('=== 测试完成 ===');
console.log('💡 提示：使用以下命令切换登录状态：');
console.log('   - 未登录：localStorage.removeItem("user"); localStorage.removeItem("token");');
console.log('   - 已登录：localStorage.setItem("user", JSON.stringify({ username: "测试用户" }));');
console.log('   - 刷新页面：location.reload();');
