/**
 * One-time script: add 'owner' to users.role ENUM (fixes registration 500 / "Data truncated for column 'role'").
 * Run from backend folder: node scripts/fix-role-enum.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { sequelize } = require('../src/config/database');

const sql = `ALTER TABLE users MODIFY COLUMN role ENUM('user', 'admin', 'owner') NOT NULL DEFAULT 'user';`;

async function run() {
  try {
    await sequelize.authenticate();
    await sequelize.query(sql);
    console.log("Done: users.role now accepts 'user', 'admin', 'owner'. You can register as Owner.");
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

run();
