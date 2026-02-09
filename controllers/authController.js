const User = require('../models/User');
const Cart = require('../models/Cart');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { validationResult } = require('express-validator');
const { secret } = require('./KeyJWT.js');
const sendEmail = require('../utils/sendEmail');

const generateJwtToken = (id, role) => {
    const payload = { id, role };
    return jwt.sign(payload, secret, { expiresIn: '24h' });
};

const getAppBaseUrl = () => process.env.APP_URL || `http://localhost:${process.env.PORT || 3003}`;
const getFrontendBaseUrl = () => process.env.FRONTEND_URL || `${getAppBaseUrl()}/frontend`;
const ALLOWED_RETURN_TO = new Set(['profile.html', 'catalog.html', 'admin.html', 'set-password.html', 'login.html']);

const sanitizeReturnTo = (value) => {
    if (!value || typeof value !== 'string') return null;
    const trimmed = value.trim();
    return ALLOWED_RETURN_TO.has(trimmed) ? trimmed : null;
};

const parseOAuthState = (state) => {
    if (!state) return { returnTo: null };

    try {
        const decoded = Buffer.from(state, 'base64url').toString('utf8');
        const parsed = JSON.parse(decoded);
        return {
            returnTo: sanitizeReturnTo(parsed?.returnTo)
        };
    } catch (error) {
        return { returnTo: null };
    }
};

const normalizeGoogleProfile = (profile) => ({
    email: profile?.emails?.[0]?.value?.toLowerCase(),
    googleId: profile?.id,
    name: profile?.displayName || null
});

const buildOAuthRedirect = ({
    token,
    isNewUser = false,
    needsPassword = false,
    error = null,
    returnTo = null
} = {}) => {
    const loginUrl = new URL('login.html', `${getFrontendBaseUrl().replace(/\/$/, '')}/`);
    const safeReturnTo = sanitizeReturnTo(returnTo);

    if (error) {
        loginUrl.searchParams.set('error', error);
        if (safeReturnTo) {
            loginUrl.searchParams.set('returnTo', safeReturnTo);
        }
        return loginUrl.toString();
    }

    const hashParams = new URLSearchParams({
        token,
        oauth: 'google',
        isNewUser: isNewUser ? '1' : '0',
        needsPassword: needsPassword ? '1' : '0'
    });
    if (safeReturnTo) {
        hashParams.set('returnTo', safeReturnTo);
    }

    return `${loginUrl.toString()}#${hashParams.toString()}`;
};

const buildUserResponse = (user) => ({
    id: user._id,
    email: user.email,
    name: user.name || null,
    role: user.role,
    isVerified: user.isVerified,
    hasPassword: Boolean(user.password),
    googleLinked: Boolean(user.googleId)
});

class authController {
    async registration(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ 
                    message: 'Validation error', 
                    errors: errors.array() 
                });
            }

            const { email, password } = req.body;
            
            const existingUser = await User.findOne({ email: email.toLowerCase() });
            if (existingUser) {
                if (existingUser.googleId && !existingUser.password) {
                    return res.status(400).json({
                        message: 'This email is already linked to Google sign-in. Please use Google login first.'
                    });
                }
                return res.status(400).json({ 
                    message: 'User with this email already exists' 
                });
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            
            const user = new User({
                email: email.toLowerCase(),
                password: hashedPassword,
                role: 'USER',
                isVerified: false,
                verificationToken: null
            });
            
            await user.save();
            
            return res.status(201).json({ 
                message: 'Registration successful. You can verify your email later from your profile.',
                user: buildUserResponse(user)
            });
        } catch (error) {
            console.error('Registration error:', error);
            return res.status(500).json({ message: 'Registration error' });
        }
    }

    async login(req, res) {
        try {
            const { email, password } = req.body;
            
            const user = await User.findOne({ email: email.toLowerCase() });
            if (!user) {
                return res.status(400).json({ 
                    message: 'Invalid email or password' 
                });
            }

            if (!user.password) {
                return res.status(400).json({
                    message: 'This account uses Google sign-in. Please continue with Google.'
                });
            }

            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                return res.status(400).json({ 
                    message: 'Invalid email or password' 
                });
            }

            const token = generateJwtToken(user._id, user.role);
            
            return res.json({ 
                token,
                user: buildUserResponse(user)
            });
        } catch (error) {
            console.error('Login error:', error);
            return res.status(500).json({ message: 'Login error' });
        }
    }

    async getUsers(req, res) {
        try {
            const users = await User.find({}, { password: 0 });
            return res.json(users);
        } catch (error) {
            console.error('Get users error:', error);
            return res.status(500).json({ message: 'Error fetching users' });
        }
    }

    async getMe(req, res) {
        try {
            const user = await User.findById(req.user.id);
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }
            return res.json(buildUserResponse(user));
        } catch (error) {
            console.error('Get me error:', error);
            return res.status(500).json({ message: 'Error fetching user' });
        }
    }

    async verifyEmail(req, res) {
        try {
            const { token } = req.query;
            if (!token) {
                return res.status(400).json({ message: 'Verification token is required' });
            }

            const user = await User.findOne({ verificationToken: token });
            if (!user) {
                return res.status(400).json({ message: 'Invalid or expired verification token' });
            }

            user.isVerified = true;
            user.verificationToken = null;
            await user.save();

            return res.json({ message: 'Email verified successfully. You can now log in.' });
        } catch (error) {
            console.error('Email verification error:', error);
            return res.status(500).json({ message: 'Email verification error' });
        }
    }

    async resendVerificationEmail(req, res) {
        try {
            const { email } = req.body;
            const normalizedEmail = email?.toLowerCase();

            const user = await User.findOne({ email: normalizedEmail });
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            if (user.isVerified) {
                return res.status(400).json({ message: 'Email is already verified' });
            }

            user.verificationToken = crypto.randomBytes(32).toString('hex');
            await user.save();

            const baseUrl = getAppBaseUrl();
            const verificationLink = `${baseUrl}/api/auth/verify-email?token=${user.verificationToken}`;

            await sendEmail(
                user.email,
                'Verify your email',
                `<h2>Email verification</h2>
                 <p>Please verify your email by clicking the link below:</p>
                 <a href="${verificationLink}">${verificationLink}</a>`
            );

            return res.json({ message: 'Verification email sent' });
        } catch (error) {
            console.error('Resend verification error:', error);
            return res.status(500).json({ message: 'Could not send verification email' });
        }
    }

    async googleCallback(req, res) {
        try {
            const { returnTo } = parseOAuthState(req.query.state);
            const profile = req.user;
            const { email, googleId, name } = normalizeGoogleProfile(profile);

            if (!email || !googleId) {
                return res.redirect(buildOAuthRedirect({ error: 'google_profile_incomplete', returnTo }));
            }

            let user = await User.findOne({
                $or: [
                    { googleId },
                    { email }
                ]
            });

            let isNewUser = false;

            if (!user) {
                isNewUser = true;
                user = new User({
                    email,
                    name,
                    googleId,
                    role: 'USER',
                    isVerified: true,
                    verificationToken: null
                });
            } else {
                if (user.googleId && user.googleId !== googleId) {
                    return res.redirect(buildOAuthRedirect({ error: 'google_account_conflict', returnTo }));
                }

                user.googleId = googleId;
                if (!user.name && name) {
                    user.name = name;
                }
                user.isVerified = true;
                user.verificationToken = null;
            }

            await user.save();

            const token = generateJwtToken(user._id, user.role);
            const needsPassword = !user.password;

            return res.redirect(buildOAuthRedirect({
                token,
                isNewUser,
                needsPassword,
                returnTo
            }));
        } catch (error) {
            console.error('Google login error:', error);
            const { returnTo } = parseOAuthState(req.query.state);
            return res.redirect(buildOAuthRedirect({ error: 'google_login_failed', returnTo }));
        }
    }

    async setPassword(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    message: 'Validation error',
                    errors: errors.array()
                });
            }

            const { password } = req.body;

            const user = await User.findById(req.user.id);
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            if (user.password) {
                return res.status(400).json({ message: 'Password is already set for this account' });
            }

            user.password = await bcrypt.hash(password, 10);
            await user.save();

            return res.json({
                message: 'Password has been set successfully',
                user: buildUserResponse(user)
            });
        } catch (error) {
            console.error('Set password error:', error);
            return res.status(500).json({ message: 'Could not set password' });
        }
    }

    async deleteUserPermanently(req, res) {
        try {
            const { id } = req.params;

            if (id === req.user.id) {
                return res.status(400).json({ message: 'You cannot delete your own account' });
            }

            const targetUser = await User.findById(id);
            if (!targetUser) {
                return res.status(404).json({ message: 'User not found' });
            }

            await Cart.deleteOne({ userId: id });
            await User.findByIdAndDelete(id);

            return res.json({ message: 'User deleted permanently' });
        } catch (error) {
            console.error('Delete user error:', error);
            return res.status(500).json({ message: 'Error deleting user' });
        }
    }
}

module.exports = new authController();
