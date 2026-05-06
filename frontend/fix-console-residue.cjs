const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');
const report = {
  scanned: 0,
  fixed: 0,
  errors: [],
  fixedFiles: []
};

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      walkDir(filePath);
    } else if (/\.(ts|tsx|js|jsx)$/.test(file)) {
      fixFile(filePath);
    }
  }
}

function fixFile(filePath) {
  report.scanned++;
  let content = fs.readFileSync(filePath, 'utf-8');
  let originalContent = content;
  let changed = false;

  const patterns = [
    { regex: /\.length\}\);/g, desc: '.length});' },
    { regex: /\.length\);/g, desc: '.length);' },
    { regex: /:\s*\w+\}\);/g, desc: ': xxx});' },
    { regex: /:\s*\w+\);/g, desc: ': xxx);' },
    { regex: /\|\|\s*['"][^'"]*['"]\}\);/g, desc: '|| "xxx"});' },
    { regex: /\|\|\s*['"][^'"]*['"]\);/g, desc: '|| "xxx");' },
    { regex: /\}\);$/gm, desc: '}); at line end (if standalone)' },
    { regex: /^\s*\);$/gm, desc: 'standalone ); line' }
  ];

  for (const { regex, desc } of patterns) {
    const matches = content.match(regex);
    if (matches && matches.length > 0) {
      content = content.replace(regex, '');
      if (content !== originalContent) {
        changed = true;
        report.fixedFiles.push({
          file: path.relative(srcDir, filePath),
          pattern: desc,
          count: matches.length
        });
      }
    }
  }

  if (changed) {
    try {
      fs.writeFileSync(filePath, content, 'utf-8');
      report.fixed++;
      console.log(`✓ Fixed: ${path.relative(srcDir, filePath)}`);
    } catch (err) {
      report.errors.push({
        file: path.relative(srcDir, filePath),
        error: err.message
      });
      console.error(`✗ Error fixing ${path.relative(srcDir, filePath)}: ${err.message}`);
    }
  }
}

console.log('Starting to fix console residue...\n');
walkDir(srcDir);

console.log('\n========== Fix Report ==========');
console.log(`Files scanned: ${report.scanned}`);
console.log(`Files fixed: ${report.fixed}`);
console.log(`Errors: ${report.errors.length}`);

if (report.fixedFiles.length > 0) {
  console.log('\nFixed patterns:');
  const grouped = {};
  for (const item of report.fixedFiles) {
    const key = item.pattern;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(item);
  }
  
  for (const [pattern, files] of Object.entries(grouped)) {
    console.log(`  ${pattern}: ${files.length} occurrences`);
    for (const f of files.slice(0, 5)) {
      console.log(`    - ${f.file} (${f.count}x)`);
    }
    if (files.length > 5) {
      console.log(`    ... and ${files.length - 5} more`);
    }
  }
}

if (report.errors.length > 0) {
  console.log('\nErrors:');
  for (const err of report.errors) {
    console.log(`  ${err.file}: ${err.error}`);
  }
}

fs.writeFileSync(
  path.join(__dirname, 'fix-report.json'),
  JSON.stringify(report, null, 2),
  'utf-8'
);

console.log('\nReport saved to fix-report.json');
