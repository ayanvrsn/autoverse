const Car = require('../models/Car');
const Config = require('../models/Config');

// Get all cars
exports.getCars = async (req, res) => {
    try {
        const cars = await Car.find({ available: true });
        res.json(cars);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching cars', error: error.message });
    }
};

// Get car by ID
exports.getCarById = async (req, res) => {
    try {
        const car = await Car.findById(req.params.id);
        if (!car) {
            return res.status(404).json({ message: 'Car not found' });
        }
        res.json(car);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching car', error: error.message });
    }
};

// Get configurations for a specific car (3 configs per car)
exports.getCarConfigs = async (req, res) => {
    try {
        const carId = req.params.id;
        
        // Verify car exists
        const car = await Car.findById(carId);
        if (!car) {
            return res.status(404).json({ message: 'Car not found' });
        }
        
        // Get all configurations for this car
        const configs = await Config.find({ carId }).sort({ priceTotal: 1 });
        res.json(configs);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching configurations', error: error.message });
    }
};

// Create new car (Admin only)
exports.createCar = async (req, res) => {
    try {
        const { brand, model, year, basePrice, heroImage, available } = req.body;
        
        const newCar = new Car({
            brand,
            model,
            year,
            basePrice,
            heroImage,
            available: available !== undefined ? available : true
        });
        
        await newCar.save();
        res.status(201).json(newCar);
    } catch (error) {
        res.status(400).json({ message: 'Error creating car', error: error.message });
    }
};

// Update car (Admin only)
exports.updateCar = async (req, res) => {
    try {
        const updated = await Car.findByIdAndUpdate(
            req.params.id, 
            req.body, 
            { new: true, runValidators: true }
        );
        
        if (!updated) {
            return res.status(404).json({ message: 'Car not found' });
        }
        
        res.json(updated);
    } catch (error) {
        res.status(400).json({ message: 'Error updating car', error: error.message });
    }
};

// Delete car (Admin only)
exports.deleteCar = async (req, res) => {
    try {
        const car = await Car.findByIdAndDelete(req.params.id);
        
        if (!car) {
            return res.status(404).json({ message: 'Car not found' });
        }
        
        // Also delete related configurations
        await Config.deleteMany({ carId: req.params.id });
        
        res.json({ message: 'Car and related configurations deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting car', error: error.message });
    }
};
