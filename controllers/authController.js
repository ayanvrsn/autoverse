const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const { secret } = require('./KeyJWT.js');

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
            
            const user = new User({
                email: email.toLowerCase(),
                password: hashedPassword,
                role: 'ADMIN'
            });
            
            await user.save();
            
            const token = generateJwtToken(user._id, user.role);
            
            return res.status(201).json({ 
                message: 'User registered successfully',
                token,
                user: {
                    id: user._id,
                    email: user.email,
                    role: user.role
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
}

module.exports = new authController();
