const User = require('../models/User');
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
                return res.status(400).json({ 
                    message: 'User with this email already exists' 
                });
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            const verificationToken = crypto.randomBytes(32).toString('hex');
            
            const user = new User({
                email: email.toLowerCase(),
                password: hashedPassword,
                role: 'USER',
                isVerified: false,
                verificationToken
            });
            
            await user.save();

            const baseUrl = process.env.APP_URL || `http://localhost:${process.env.PORT || 3003}`;
            const verificationLink = `${baseUrl}/api/auth/verify-email?token=${verificationToken}`;

            await sendEmail(
                user.email,
                'Verify your email',
                `<h2>Welcome to AutoShop</h2>
                 <p>Click the button below to verify your email:</p>
                 <a href="${verificationLink}" style="display:inline-block;padding:10px 16px;background:#111;color:#fff;text-decoration:none;border-radius:6px;">Verify Email</a>
                 <p>If you did not create this account, please ignore this email.</p>`
            );
            
            return res.status(201).json({ 
                message: 'Registration successful. Please check your email to verify your account.',
                user: {
                    id: user._id,
                    email: user.email,
                    role: user.role,
                    isVerified: user.isVerified
                }
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

            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                return res.status(400).json({ 
                    message: 'Invalid email or password' 
                });
            }

            if (!user.isVerified) {
                return res.status(403).json({
                    message: 'Please verify your email before logging in'
                });
            }

            const token = generateJwtToken(user._id, user.role);
            
            return res.json({ 
                token,
                user: {
                    id: user._id,
                    email: user.email,
                    role: user.role
                }
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
            const user = await User.findById(req.user.id, { password: 0 });
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }
            return res.json(user);
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

            const baseUrl = process.env.APP_URL || `http://localhost:${process.env.PORT || 3003}`;
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
}

module.exports = new authController();
