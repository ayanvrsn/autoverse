const express = require('express');
const router = express.Router();
const { getVehicles, createVehicle, getVehicleById, updateVehicle, deleteVehicle } = require('../controllers/vehicleController');

router.get('/', getVehicles);
router.post('/', createVehicle);
router.get('/:id', getVehicleById);
router.put('/:id', updateVehicle);
router.delete('/:id', deleteVehicle);

module.exports = router;
