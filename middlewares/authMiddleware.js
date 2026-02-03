const jwt = require('jsonwebtoken')
const User = require('../models/User');
const {secret} = require('../controllers/KeyJWT')
module.exports = async function (req,res,next) {
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
        const user = await User.findById(decoded.id).select('_id');
        if (!user) {
            return res.status(401).json({ message: "User not authorized" });
        }
        req.user = decoded
        next()
    } catch (error) {
        console.log(error)
        return res.status(401).json({message:"User not authorized"})

    }
}
