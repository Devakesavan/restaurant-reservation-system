const { validationResult } = require('express-validator');
const { User } = require('../models');
const generateToken = require('../utils/generateToken');
const { logActivity } = require('../utils/activityLogger');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { name, email, password, role } = req.body;
    const normalizedRole = role ? String(role).toLowerCase().trim() : 'user';
    if (!['user', 'admin', 'owner'].includes(normalizedRole)) {
      return res.status(400).json({ message: 'Role must be user, admin, or owner' });
    }
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }
    const user = await User.create({
      name,
      email,
      password,
      role: normalizedRole,
    });
    await logActivity('register', 'user', user.id, user.id, { email: user.email, role: user.role });
    const token = generateToken(user.id, user.role);
    res.status(201).json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      token,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    await logActivity('login', 'user', user.id, user.id, { email: user.email });
    const token = generateToken(user.id, user.role);
    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      token,
    });
  } catch (error) {
    next(error);
  }
};
