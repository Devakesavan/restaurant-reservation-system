const express = require('express');
const { body, param } = require('express-validator');
const {
  getAllRestaurants,
  searchRestaurants,
  getSeatsAvailability,
  getMyRestaurants,
  getRestaurantBookings,
  addRestaurant,
  updateRestaurant,
  deleteRestaurant,
} = require('../controllers/restaurantController');
const { protect } = require('../middlewares/authMiddleware');
const { restrictTo } = require('../middlewares/roleMiddleware');

const router = express.Router();

router.get('/', getAllRestaurants);
router.get('/search', searchRestaurants);
router.get('/:id/availability', getSeatsAvailability);

router.use(protect);
router.use(restrictTo('owner'));

router.get('/my', getMyRestaurants);
router.get('/:id/bookings', param('id').isInt().withMessage('Valid restaurant ID required'), getRestaurantBookings);

const restaurantBodyValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('cuisine').trim().notEmpty().withMessage('Cuisine is required'),
  body('location').trim().notEmpty().withMessage('Location is required'),
  body('rating').optional().isFloat({ min: 0, max: 5 }).withMessage('Rating must be 0-5'),
  body('totalSeats').isInt({ min: 1 }).withMessage('Total seats must be at least 1'),
];

router.post('/', restaurantBodyValidation, addRestaurant);
router.put(
  '/:id',
  param('id').isInt().withMessage('Valid restaurant ID required'),
  body('name').optional().trim().notEmpty(),
  body('cuisine').optional().trim().notEmpty(),
  body('location').optional().trim().notEmpty(),
  body('rating').optional().isFloat({ min: 0, max: 5 }),
  body('totalSeats').optional().isInt({ min: 1 }),
  updateRestaurant
);
router.delete('/:id', param('id').isInt().withMessage('Valid restaurant ID required'), deleteRestaurant);

module.exports = router;
