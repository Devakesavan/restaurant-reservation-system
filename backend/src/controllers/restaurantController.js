const { Op } = require('sequelize');
const { Restaurant, Reservation, User } = require('../models');
const { validationResult } = require('express-validator');

// @desc    Get all restaurants
// @route   GET /api/restaurants
// @access  Public
exports.getAllRestaurants = async (req, res, next) => {
  try {
    const restaurants = await Restaurant.findAll({
      order: [['name', 'ASC']],
    });
    res.json(restaurants);
  } catch (error) {
    next(error);
  }
};

// @desc    Search restaurants by name, cuisine, or location
// @route   GET /api/restaurants/search
// @access  Public
exports.searchRestaurants = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q || typeof q !== 'string' || !q.trim()) {
      return res.status(400).json({ message: 'Search query (q) is required' });
    }
    const searchTerm = `%${q.trim()}%`;
    const restaurants = await Restaurant.findAll({
      where: {
        [Op.or]: [
          { name: { [Op.like]: searchTerm } },
          { cuisine: { [Op.like]: searchTerm } },
          { location: { [Op.like]: searchTerm } },
        ],
      },
      order: [['name', 'ASC']],
    });
    res.json(restaurants);
  } catch (error) {
    next(error);
  }
};

// @desc    Get seats availability for a restaurant at date + time
// @route   GET /api/restaurants/:id/availability
// @access  Public
exports.getSeatsAvailability = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { date, time } = req.query;
    if (!date || !time) {
      return res.status(400).json({ message: 'Query params date and time are required (YYYY-MM-DD and HH:mm)' });
    }
    const restaurant = await Restaurant.findByPk(id);
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }
    const booked = (await Reservation.sum('guests', {
      where: { restaurantId: id, date, time },
    })) || 0;
    const totalSeats = restaurant.totalSeats ?? 0;
    const available = Math.max(0, totalSeats - booked);
    res.json({ totalSeats, booked, available });
  } catch (error) {
    next(error);
  }
};

// @desc    Get restaurants owned by current user (owner only)
// @route   GET /api/restaurants/my
// @access  Private/Owner
exports.getMyRestaurants = async (req, res, next) => {
  try {
    const restaurants = await Restaurant.findAll({
      where: { ownerId: req.user.id },
      order: [['name', 'ASC']],
    });
    res.json(restaurants.map((r) => r.get({ plain: true })));
  } catch (error) {
    next(error);
  }
};

// @desc    Get booking status for a restaurant (owner: own restaurants only)
// @route   GET /api/restaurants/:id/bookings
// @access  Private/Owner
exports.getRestaurantBookings = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findByPk(req.params.id);
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }
    if (restaurant.ownerId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to view this restaurant' });
    }
    const bookings = await Reservation.findAll({
      where: { restaurantId: req.params.id },
      include: [{ model: User, attributes: ['id', 'name', 'email'] }],
      order: [['date', 'ASC'], ['time', 'ASC']],
    });
    const bySlot = {};
    bookings.forEach((b) => {
      const key = `${b.date}_${b.time}`;
      if (!bySlot[key]) bySlot[key] = { date: b.date, time: b.time, booked: 0, reservations: [] };
      bySlot[key].booked += b.guests;
      bySlot[key].reservations.push(b);
    });
    const totalSeats = restaurant.totalSeats ?? 0;
    res.json({
      restaurant: { id: restaurant.id, name: restaurant.name, totalSeats },
      bookings: Object.values(bySlot),
      allReservations: bookings,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add restaurant (owner only; ownerId = current user)
// @route   POST /api/restaurants
// @access  Private/Owner
exports.addRestaurant = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { name, cuisine, location, rating, totalSeats } = req.body;
    const restaurant = await Restaurant.create({
      name,
      cuisine,
      location,
      rating: rating || null,
      totalSeats: totalSeats != null ? Number(totalSeats) : 1,
      ownerId: req.user.id,
    });
    res.status(201).json(restaurant.get({ plain: true }));
  } catch (error) {
    next(error);
  }
};

// @desc    Update restaurant (owner: own only)
// @route   PUT /api/restaurants/:id
// @access  Private/Owner
exports.updateRestaurant = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const restaurant = await Restaurant.findByPk(req.params.id);
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }
    if (restaurant.ownerId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this restaurant' });
    }
    const { name, cuisine, location, rating, totalSeats } = req.body;
    await restaurant.update({
      ...(name !== undefined && { name }),
      ...(cuisine !== undefined && { cuisine }),
      ...(location !== undefined && { location }),
      ...(rating !== undefined && { rating }),
      ...(totalSeats !== undefined && { totalSeats: Number(totalSeats) }),
    });
    res.json(restaurant);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete restaurant (owner: own only)
// @route   DELETE /api/restaurants/:id
// @access  Private/Owner
exports.deleteRestaurant = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findByPk(req.params.id);
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }
    if (restaurant.ownerId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this restaurant' });
    }
    await restaurant.destroy();
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
