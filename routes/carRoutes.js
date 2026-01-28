const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware')
const roleMiddleware = require('../middlewares/roleMiddleware')
const { getCars, createCar, getCarById, updateCar, deleteCar} = require('../controllers/CarController')

router.get('/cars' ,getCars);
router.post('/cars',roleMiddleware(['ADMIN']), createCar);
router.get('/cars/:id',authMiddleware, getCarById);
router.put('/cars/:id', roleMiddleware(['ADMIN']),updateCar);
router.delete('/cars/:id', roleMiddleware(['ADMIN']), deleteCar);

module.exports = router;
