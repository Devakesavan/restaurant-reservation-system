/**
 * One-time script: add owner_id to restaurants (fixes GET /api/restaurants/my 500).
 * Run from backend folder: node scripts/add-restaurant-owner-id.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { sequelize } = require('../src/config/database');

async function run() {
  try {
    await sequelize.authenticate();
    const [rows] = await sequelize.query(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'restaurants' AND COLUMN_NAME = 'owner_id'"
    );
    if (rows.length > 0) {
      console.log("Column owner_id already exists on restaurants. Nothing to do.");
      await sequelize.close();
      return;
    }
    await sequelize.query("ALTER TABLE restaurants ADD COLUMN owner_id INT NULL");
    try {
      await sequelize.query(
        "ALTER TABLE restaurants ADD CONSTRAINT fk_restaurants_owner FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL"
      );
    } catch (e) {
      // FK optional if it already exists or fails
    }
    console.log("Done: restaurants.owner_id added. GET /api/restaurants/my should work now.");
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

run();
