// 批量修复images到image的引用
const fs = require('fs');
const path = require('path');

const files = [
  'backend/src/controllers/adminController.ts',
  'backend/src/controllers/destinationController.ts',
  'backend/src/controllers/hotSpotController.ts',
  'backend/src/services/favoriteService.ts',
  'backend/src/services/imageService.ts'
];

files.forEach(file => {
  const filePath = path.join('D:/CodeArtsFile/LiveTrip', file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // 替换include中的images为image
  content = content.replace(/include:\s*{\s*images:/g, 'include: {\n          image:');
  
  // 替换spot.images为spot.image
  content = content.replace(/spot\.images/g, 'spot.image');
  
  // 替换spot.images || []为spot.image
  content = content.replace(/spot\.image\s*\|\|\s*\[\]/g, 'spot.image');
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`✅ 已修复: ${file}`);
});

console.log('所有文件修复完成！');
