/**
 * Migration: Remove incorrect UNIQUE constraint from reservations table.
 *
 * Problem: If the table has a UNIQUE index on (restaurant_id, date, time) — or
 * any combination that does NOT include user_id — then only ONE reservation
 * per slot is allowed. That blocks different users from booking the same slot
 * (e.g. 20 seats, 1 booked, 19 free → second user still gets "duplicate").
 *
 * Fix: Drop any unique index on reservations that does not include user_id,
 * so multiple reservations per (restaurant_id, date, time) are allowed,
 * with total guests enforced in application logic.
 *
 * Run from backend folder: node migrations/remove-reservations-slot-unique.js
 */

require('dotenv').config();
const { sequelize } = require('../src/config/database');

async function run() {
  const tableName = 'reservations';
  const dbName = process.env.DB_NAME;

  try {
    await sequelize.authenticate();
    console.log('Connected to MySQL.');

    // Get unique indexes (Non_unique = 0) and their columns
    const [rows] = await sequelize.query(
      `SELECT INDEX_NAME, COLUMN_NAME, SEQ_IN_INDEX
       FROM INFORMATION_SCHEMA.STATISTICS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND NON_UNIQUE = 0
       ORDER BY INDEX_NAME, SEQ_IN_INDEX`,
      { replacements: [dbName, tableName] }
    );

    if (rows.length === 0) {
      console.log('No unique indexes found on', tableName, '- nothing to change.');
      process.exit(0);
      return;
    }

    // Group by index name and collect column names (use DB column names: user_id, restaurant_id, date, time)
    const indexColumns = {};
    for (const r of rows) {
      const name = r.INDEX_NAME;
      if (!indexColumns[name]) indexColumns[name] = [];
      indexColumns[name].push(r.COLUMN_NAME);
    }

    // PRIMARY is the primary key - never drop
    for (const [indexName, columns] of Object.entries(indexColumns)) {
      if (indexName === 'PRIMARY') continue;
      const hasUserId = columns.some((c) => c === 'user_id');
      if (!hasUserId) {
        console.log('Found bad unique index:', indexName, 'columns:', columns.join(', '));
        // MySQL needs an index on restaurant_id for the FK. The unique index we're dropping
        // currently provides it. Add a non-unique index first so we can drop the unique one.
        const [existing] = await sequelize.query(
          `SELECT 1 FROM INFORMATION_SCHEMA.STATISTICS
           WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND INDEX_NAME = 'idx_restaurant_id'
           LIMIT 1`,
          { replacements: [dbName, tableName] }
        );
        if (existing.length === 0) {
          console.log('Adding non-unique index on restaurant_id (for FK)...');
          await sequelize.query(`ALTER TABLE \`${tableName}\` ADD INDEX \`idx_restaurant_id\` (\`restaurant_id\`)`);
        }
        console.log('Dropping unique index:', indexName);
        await sequelize.query(`ALTER TABLE \`${tableName}\` DROP INDEX \`${indexName}\``);
        console.log('Dropped. Multiple reservations per slot are now allowed.');
      } else {
        console.log('Keeping unique index:', indexName, '(includes user_id).');
      }
    }

    console.log('Done.');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

run();
