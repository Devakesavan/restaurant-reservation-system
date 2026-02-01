/**
 * One-time script: add missing columns to restaurants (total_seats, owner_id).
 * Fixes "Unknown column 'total_seats' in 'field list'" and owner_id.
 * Run from backend folder: node scripts/sync-restaurants-table.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { sequelize } = require('../src/config/database');

async function hasColumn(table, column) {
  const [rows] = await sequelize.query(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    { replacements: [table, column] }
  );
  return rows.length > 0;
}

async function run() {
  try {
    await sequelize.authenticate();

    if (!(await hasColumn('restaurants', 'total_seats'))) {
      await sequelize.query(
        'ALTER TABLE restaurants ADD COLUMN total_seats INT NOT NULL DEFAULT 1'
      );
      console.log('Added restaurants.total_seats');
    } else {
      console.log('restaurants.total_seats already exists');
    }

    if (!(await hasColumn('restaurants', 'owner_id'))) {
      await sequelize.query('ALTER TABLE restaurants ADD COLUMN owner_id INT NULL');
      try {
        await sequelize.query(
          'ALTER TABLE restaurants ADD CONSTRAINT fk_restaurants_owner FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL'
        );
      } catch (e) {
        // FK optional
      }
      console.log('Added restaurants.owner_id');
    } else {
      console.log('restaurants.owner_id already exists');
    }

    console.log('Done. Restaurants table is in sync.');
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

run();
