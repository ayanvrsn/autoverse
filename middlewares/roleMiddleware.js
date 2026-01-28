const jwt = require('jsonwebtoken')
const {secret} = require('../controllers/KeyJWT')

module.exports = function(roles) {
    return function (req, res, next) {
        if (req.method === "OPTIONS") {
                return next()
            }
            try {
                const authHeader = req.headers.authorization
                if (!authHeader) {
                    return res.status(401).json({message:"User not authorized"})
                }
                const token = authHeader.split(' ')[1]
                if (!token) {
                    return res.status(401).json({message:"User not authorized"})
                }
                const {roles: userRoles} = jwt.verify(token, secret)
                let hasRole = false;
                userRoles.forEach(role => {
                    if (roles.includes(role)) {
                        hasRole = true
                    }
                });
                if (!hasRole) {
                    return res.status(401).json({message:"Access restricted"})
                }
                next()
            } catch (error) {
                console.log(error)
                return res.status(401).json({message:"User not authorized"})
        
            }
    }
}