const { User, Restaurant, Reservation, ActivityLog } = require('../models');
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');

// @desc    Get dashboard stats (users, restaurants, bookings)
// @route   GET /api/admin/stats
// @access  Private/Admin
exports.getStats = async (req, res, next) => {
  try {
    const usersCount = await User.count();
    const restaurantsCount = await Restaurant.count();

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [daily, weekly, monthly] = await Promise.all([
      Reservation.count({ where: { createdAt: { [Op.gte]: startOfDay } } }),
      Reservation.count({ where: { createdAt: { [Op.gte]: startOfWeek } } }),
      Reservation.count({ where: { createdAt: { [Op.gte]: startOfMonth } } }),
    ]);

    const totalSeatsBooked =
      (await Reservation.sum('guests', { where: { date: { [Op.gte]: sequelize.fn('CURDATE') } } })) || 0;

    res.json({
      usersCount,
      restaurantsCount,
      bookings: { daily, weekly, monthly },
      totalSeatsBooked,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get activity logs (read-only)
// @route   GET /api/admin/activity-logs
// @access  Private/Admin
exports.getActivityLogs = async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 100, 500);
    const offset = parseInt(req.query.offset, 10) || 0;
    const logs = await ActivityLog.findAll({
      include: [{ model: User, attributes: ['id', 'name', 'email', 'role'] }],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });
    const total = await ActivityLog.count();
    res.json({ logs, total });
  } catch (error) {
    next(error);
  }
};
