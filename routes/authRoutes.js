const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const controller = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

// Register
router.post('/register', [
    check('email', 'Invalid email format').isEmail(),
    check('password', 'Password must be 6-20 characters').isLength({ min: 6, max: 20 })
], controller.registration);

// Login
router.post('/login', [
    check('email', 'Email is required').notEmpty(),
    check('password', 'Password is required').notEmpty()
], controller.login);

// Get current user
router.get('/me', authMiddleware, controller.getMe);

// Get all users (Admin only)
router.get('/users', roleMiddleware(['ADMIN']), controller.getUsers);

module.exports = router;
