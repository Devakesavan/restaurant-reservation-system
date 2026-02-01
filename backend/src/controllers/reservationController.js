const { Reservation, Restaurant, sequelize } = require('../models');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');
const { logActivity } = require('../utils/activityLogger');

// @desc    Create reservation (transaction + lock to prevent overbooking)
// @route   POST /api/reservations
// @access  Private
exports.createReservation = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { restaurantId, date, time, guests, contactNumber } = req.body;
    const userId = req.user.id;

    const result = await sequelize.transaction(async (t) => {
      const restaurant = await Restaurant.findByPk(restaurantId, {
        lock: t.LOCK.UPDATE,
        transaction: t,
      });
      if (!restaurant) {
        const err = new Error('Restaurant not found');
        err.statusCode = 404;
        throw err;
      }

      const booked =
        (await Reservation.sum('guests', {
          where: { restaurantId, date, time },
          transaction: t,
        })) || 0;
      const totalSeats = restaurant.totalSeats ?? 0;
      const available = Math.max(0, totalSeats - booked);
      if (guests > available) {
        const err = new Error(
          `Only ${available} seat(s) available for this date and time. Please choose fewer guests or another slot.`
        );
        err.statusCode = 409;
        throw err;
      }

      const reservation = await Reservation.create(
        {
          userId,
          restaurantId,
          date,
          time,
          guests,
          contactNumber,
        },
        { transaction: t }
      );
      return reservation;
    });

    await logActivity('create', 'reservation', result.id, userId, {
      restaurantId,
      date,
      time,
      guests,
    });
    const withRestaurant = await Reservation.findByPk(result.id, {
      include: [{ model: Restaurant, attributes: ['id', 'name', 'cuisine', 'location'] }],
    });
    res.status(201).json(withRestaurant);
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    next(error);
  }
};

// @desc    Get current user's reservations
// @route   GET /api/reservations/my
// @access  Private
exports.getMyReservations = async (req, res, next) => {
  try {
    const reservations = await Reservation.findAll({
      where: { userId: req.user.id },
      include: [{ model: Restaurant, attributes: ['id', 'name', 'cuisine', 'location', 'rating'] }],
      order: [['date', 'ASC'], ['time', 'ASC']],
    });
    res.json(reservations);
  } catch (error) {
    next(error);
  }
};
