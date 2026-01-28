const express = require('express');
const router = express.Router();
const controller = require('../controllers/authController')
const {check} = require('express-validator')
const authMiddleware = require('../middlewares/authMiddleware')
const roleMiddleware = require('../middlewares/roleMiddleware')

router.post('/signup', [
    check('username', "Can not be empty").notEmpty(),
    check('password', "Length must and at least 8 and at most 12").isLength({min:8, max:12}),
],controller.registration)

router.post('/login', controller.login)
router.get('/users', roleMiddleware(["ADMIN"]), controller.getUsers)

module.exports = router;