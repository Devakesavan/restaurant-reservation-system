const { ActivityLog } = require('../models');

const logActivity = async (action, entity, entityId = null, userId = null, metadata = null) => {
  try {
    await ActivityLog.create({ action, entity, entityId, userId, metadata });
  } catch (err) {
    console.error('Activity log failed:', err.message);
  }
};

module.exports = { logActivity };
