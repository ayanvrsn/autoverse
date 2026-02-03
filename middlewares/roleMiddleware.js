const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { secret } = require('../controllers/KeyJWT');

module.exports = function(allowedRoles) {
    return async function(req, res, next) {
        if (req.method === "OPTIONS") {
            return next();
        }
        
        try {
            const authHeader = req.headers.authorization;
            if (!authHeader) {
                return res.status(401).json({ message: "Authorization required" });
            }
            
            const token = authHeader.split(' ')[1];
            if (!token) {
                return res.status(401).json({ message: "Authorization required" });
            }
            
            const decoded = jwt.verify(token, secret);
            const user = await User.findById(decoded.id).select('_id role');
            if (!user) {
                return res.status(401).json({ message: "User not authorized" });
            }
            req.user = { ...decoded, role: user.role };
            
            if (!allowedRoles.includes(user.role)) {
                return res.status(403).json({ message: "Access denied. Insufficient permissions." });
            }
            
            next();
        } catch (error) {
            console.error('Auth error:', error.message);
            return res.status(401).json({ message: "Invalid or expired token" });
        }
    };
};
