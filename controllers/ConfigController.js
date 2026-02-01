const Config = require('../models/Config');
const Car = require('../models/Car');

exports.getConfigs = async (req, res) => {
    try {
        const configs = await Config.find().populate('carId', 'brand model');
        res.json(configs);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching configurations', error: error.message });
    }
};

exports.getConfigById = async (req, res) => {
    try {
        const config = await Config.findById(req.params.id).populate('carId');
        if (!config) {
            return res.status(404).json({ message: 'Configuration not found' });
        }
        res.json(config);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching configuration', error: error.message });
    }
};

exports.createConfig = async (req, res) => {
    try {
        const { carId, name, priceTotal, sketchfabEmbedHtml, specs } = req.body;
        
        const car = await Car.findById(carId);
        if (!car) {
            return res.status(404).json({ message: 'Car not found' });
        }
        
        const existingConfigs = await Config.countDocuments({ carId });
        if (existingConfigs >= 3) {
            return res.status(400).json({ 
                message: 'Car already has 3 configurations. Delete one before adding a new one.' 
            });
        }
        
        const newConfig = new Config({
            carId,
            name,
            priceTotal,
            sketchfabEmbedHtml,
            specs
        });
        
        await newConfig.save();
        res.status(201).json(newConfig);
    } catch (error) {
        res.status(400).json({ message: 'Error creating configuration', error: error.message });
    }
};

exports.updateConfig = async (req, res) => {
    try {
        const updated = await Config.findByIdAndUpdate(
            req.params.id, 
            req.body, 
            { new: true, runValidators: true }
        );
        
        if (!updated) {
            return res.status(404).json({ message: 'Configuration not found' });
        }
        
        res.json(updated);
    } catch (error) {
        res.status(400).json({ message: 'Error updating configuration', error: error.message });
    }
};

exports.deleteConfig = async (req, res) => {
    try {
        const config = await Config.findByIdAndDelete(req.params.id);
        
        if (!config) {
            return res.status(404).json({ message: 'Configuration not found' });
        }
        
        res.json({ message: 'Configuration deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting configuration', error: error.message });
    }
};
