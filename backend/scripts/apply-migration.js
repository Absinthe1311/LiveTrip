const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

// Read migration SQL file
const migrationPath = path.join(__dirname, '../prisma/migrations/20260313085107_add_image_management/migration.sql');
const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

// Connect to database
const db = new Database(path.join(__dirname, '../prisma/dev.db'));

try {
  // Enable foreign keys
  db.pragma('foreign_keys = ON');

  // Execute migration
  console.log('Applying migration...');
  db.exec(migrationSQL);
  console.log('Migration applied successfully!');

  // Verify changes
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
  console.log('\nTables in database:', tables.map(t => t.name));

  const spotImageColumns = db.prepare("PRAGMA table_info(SpotImage)").all();
  console.log('\nSpotImage columns:', spotImageColumns.map(c => c.name));

  const userColumns = db.prepare("PRAGMA table_info(User)").all();
  console.log('\nUser columns:', userColumns.map(c => c.name));

  const blogPostColumns = db.prepare("PRAGMA table_info(BlogPost)").all();
  console.log('\nBlogPost columns:', blogPostColumns.map(c => c.name));

} catch (error) {
  console.error('Error applying migration:', error);
  process.exit(1);
} finally {
  db.close();
}
