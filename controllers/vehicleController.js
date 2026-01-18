const Vehicle = require('../models/Vehicle');

exports.getVehicles = async (req, res) => {
    const data = await Vehicle.find();
    res.json(data);
};

exports.createVehicle = async (req, res) => {
    try {
        const newItem = new Vehicle(req.body);
        await newItem.save();
        res.status(201).json(newItem);
    } catch (err) { res.status(400).json({ error: err.message }); }
};

exports.getVehicleById = async (req, res) => {
    const item = await Vehicle.findById(req.params.id);
    item ? res.json(item) : res.status(404).send('Not Found');
};

exports.updateVehicle = async (req, res) => {
    const updated = await Vehicle.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
};

exports.deleteVehicle = async (req, res) => {
    await Vehicle.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
};
