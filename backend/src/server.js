require('dotenv').config();
const app = require('./app');
const { sequelize, testConnection } = require('./config/database');
const { User, Restaurant, Reservation, ActivityLog } = require('./models');

const PORT = process.env.PORT || 5001;

const startServer = async () => {
  await testConnection();
  await sequelize.sync({ alter: false });
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
