const express = require('express');
const { body } = require('express-validator');
const { createReservation, getMyReservations } = require('../controllers/reservationController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(protect);

const createReservationValidation = [
  body('restaurantId').isInt().withMessage('Valid restaurant ID is required'),
  body('date').isDate().withMessage('Valid date (YYYY-MM-DD) is required'),
  body('time').trim().notEmpty().withMessage('Time is required'),
  body('guests').isInt({ min: 1 }).withMessage('Guests must be at least 1'),
  body('contactNumber').trim().notEmpty().withMessage('Contact number is required'),
];

router.post('/', createReservationValidation, createReservation);
router.get('/my', getMyReservations);

module.exports = router;
