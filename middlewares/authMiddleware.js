const jwt = require('jsonwebtoken')
const {secret} = require('../controllers/KeyJWT')
module.exports = function (req,res,next) {
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
        const decoded = jwt.verify(token, secret)
        req.user = decoded
        next()
    } catch (error) {
        console.log(error)
        return res.status(401).json({message:"User not authorized"})

    }
}