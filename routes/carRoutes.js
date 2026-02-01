const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const { 
    getCars, 
    createCar, 
    getCarById, 
    updateCar, 
    deleteCar,
    getCarConfigs 
} = require('../controllers/CarController');

router.get('/', getCars);
router.get('/:id', getCarById);
router.get('/:id/configs', getCarConfigs);

router.post('/', roleMiddleware(['ADMIN']), createCar);
router.put('/:id', roleMiddleware(['ADMIN']), updateCar);
router.delete('/:id', roleMiddleware(['ADMIN']), deleteCar);

module.exports = router;
