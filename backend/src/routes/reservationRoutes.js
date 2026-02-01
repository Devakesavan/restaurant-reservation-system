const express = require('express');
const { body } = require('express-validator');
const { createReservation, getMyReservations } = require('../controllers/reservationController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(protect);

const createReservationValidation = [
  body('restaurantId').isInt().withMessage('Valid restaurant ID is required'),
  body('date').matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('Valid date (YYYY-MM-DD) is required'),
  body('time').trim().notEmpty().withMessage('Time is required'),
  body('guests').isInt({ min: 1 }).withMessage('Guests must be at least 1'),
  body('contactNumber').trim().notEmpty().withMessage('Contact number is required').isLength({ max: 20 }).withMessage('Contact number must be at most 20 characters'),
];

router.post('/', createReservationValidation, createReservation);
router.get('/my', getMyReservations);

module.exports = router;
