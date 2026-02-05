// 测试环境变量加载
import dotenv from 'dotenv';

console.log('加载 .env 文件...');
dotenv.config();

console.log('环境变量:');
console.log('AMAP_API_KEY:', process.env.AMAP_API_KEY ? '已配置' : '未配置');
console.log('ANTHROPIC_API_KEY:', process.env.ANTHROPIC_API_KEY ? '已配置' : '未配置');
console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? '已配置' : '未配置');
console.log('PORT:', process.env.PORT);
