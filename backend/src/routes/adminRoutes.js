const express = require('express');
const { getStats, getActivityLogs } = require('../controllers/adminController');
const { protect } = require('../middlewares/authMiddleware');
const { restrictTo } = require('../middlewares/roleMiddleware');

const router = express.Router();

router.use(protect);
router.use(restrictTo('admin'));

router.get('/stats', getStats);
router.get('/activity-logs', getActivityLogs);

module.exports = router;
