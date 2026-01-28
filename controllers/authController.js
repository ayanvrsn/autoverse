const User = require('../models/User');
const Role = require('../models/Role');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const { secret } = require('../controllers/KeyJWT.js');

const generateJwtToken = (id, roles) => {
  const payload = {
    id,
    roles,
  };
  return jwt.sign(payload, secret, { expiresIn: '1h' });
};

class authController {
  async registration(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(400)
          .json({ message: 'Error during registration process', errors });
      }

      const { username, password } = req.body;
      const guest = await User.findOne({ username });
      if (guest) {
        return res
          .status(400)
          .json({
            message:
              'Username already exists. Please choose another username',
          });
      }

      const hashedPassword = bcrypt.hashSync(password, 5);
      const userRole = await Role.findOne({ value: 'USER' });
      const user = new User({
        username,
        password: hashedPassword,
        roles: [userRole.value],
      });
      await user.save();
      return res.json({ message: 'User successfully registered' });
    } catch (error) {
      console.log(error);
      return res.status(400).json({ message: 'Registration error' });
    }
  }

  async login(req, res) {
    try {
      const { username, password } = req.body;
      const user = await User.findOne({ username });
      if (!user) {
        return res
          .status(400)
          .json({
            message: `User with username ${username} does not exist`,
          });
      }

      const isPasswordCorrect = bcrypt.compareSync(password, user.password);
      if (!isPasswordCorrect) {
        return res.status(400).json({ message: 'Incorrect password' });
      }

      const token = generateJwtToken(user._id, user.roles);
      return res.json({ token });
    } catch (error) {
      console.log(error);
      return res.status(400).json({ message: 'Login error' });
    }
  }

  async getUsers(req, res) {
    try {
      const users = await User.find({}, { password: 0 });
      return res.json(users);
    } catch (error) {
      console.log(error);
      return res.status(400).json({ message: 'List of users error' });
    }
  }
}

module.exports = new authController();
