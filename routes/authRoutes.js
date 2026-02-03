const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const controller = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

router.post('/register', [
    check('email', 'Invalid email format').isEmail(),
    check('password', 'Password must be 6-20 characters').isLength({ min: 6, max: 20 })
], controller.registration);

router.post('/login', [
    check('email', 'Email is required').notEmpty(),
    check('password', 'Password is required').notEmpty()
], controller.login);

router.get('/verify-email', controller.verifyEmail);

router.post('/resend-verification', [
    check('email', 'Invalid email format').isEmail()
], controller.resendVerificationEmail);

router.get('/me', authMiddleware, controller.getMe);

router.get('/users', roleMiddleware(['ADMIN']), controller.getUsers);
router.delete('/users/:id', roleMiddleware(['ADMIN']), controller.deleteUserPermanently);

module.exports = router;
