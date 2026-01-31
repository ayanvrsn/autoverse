const jwt = require('jsonwebtoken');
const { secret } = require('../controllers/KeyJWT');

module.exports = function(allowedRoles) {
    return function(req, res, next) {
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
            req.user = decoded;
            
            if (!allowedRoles.includes(decoded.role)) {
                return res.status(403).json({ message: "Access denied. Insufficient permissions." });
            }
            
            next();
        } catch (error) {
            console.error('Auth error:', error.message);
            return res.status(401).json({ message: "Invalid or expired token" });
        }
    };
};
