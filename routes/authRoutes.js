const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const controller = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const { passport, canUseGoogleAuth } = require('../config/passport');

const getAppBaseUrl = () => process.env.APP_URL || `http://localhost:${process.env.PORT || 3003}`;
const getFrontendBaseUrl = () => (process.env.FRONTEND_URL || `${getAppBaseUrl()}/frontend`).replace(/\/$/, '');

const ensureGoogleAuthConfigured = (req, res, next) => {
    if (!canUseGoogleAuth) {
        if (req.query.source === 'frontend') {
            return res.redirect(`${getFrontendBaseUrl()}/login.html?error=google_not_configured`);
        }
        return res.status(503).json({ message: 'Google authentication is not configured' });
    }
    next();
};

router.post('/register', [
    check('email', 'Invalid email format').isEmail(),
    check('password', 'Password must be 6-20 characters').isLength({ min: 6, max: 20 })
], controller.registration);

router.post('/login', [
    check('email', 'Email is required').notEmpty(),
    check('password', 'Password is required').notEmpty()
], controller.login);

router.get('/google',
    ensureGoogleAuthConfigured,
    passport.authenticate('google', { scope: ['profile', 'email'], session: false })
);

router.get('/google/callback',
    ensureGoogleAuthConfigured,
    passport.authenticate('google', {
        session: false,
        failureRedirect: `${getFrontendBaseUrl()}/login.html?error=google_auth_failed`
    }),
    controller.googleCallback
);

router.get('/verify-email', controller.verifyEmail);

router.post('/resend-verification', [
    check('email', 'Invalid email format').isEmail()
], controller.resendVerificationEmail);

router.post('/set-password', authMiddleware, [
    check('password', 'Password must be 6-20 characters').isLength({ min: 6, max: 20 })
], controller.setPassword);

router.get('/me', authMiddleware, controller.getMe);

router.get('/users', roleMiddleware(['ADMIN']), controller.getUsers);
router.delete('/users/:id', roleMiddleware(['ADMIN']), controller.deleteUserPermanently);

module.exports = router;
