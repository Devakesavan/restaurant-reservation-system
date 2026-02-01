-- Add 'owner' to the users.role ENUM (fixes "Data truncated for column 'role'" when registering as Owner)
-- Run this once if your users table was created before the owner role was added.
-- Example: mysql -u root -p your_database_name < migrations/add-owner-role.sql

ALTER TABLE users
  MODIFY COLUMN role ENUM('user', 'admin', 'owner') NOT NULL DEFAULT 'user';
