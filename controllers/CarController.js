const Car = require('../models/Car');


exports.getCars = async (req, res) => {
    const data = await Car.find()
    res.json(data)
}

exports.createCar = async (req, res) => {
    try {
        const newCar = new Car(req.body);
        await newCar.save();
        res.status(201).json(newCar);
    } catch (err) {
        res.status(400).json({error: err.message})
    }
};

exports.getCarById = async (req,res) => {
    const item = await Car.findById(req.params.id);
    item ? res.json(item) : res.status(404).send('Not found!')
}

exports.updateCar = async (req,res) => {
    const updated = await Car.findByIdAndUpdate(req.params.id, req.body, {new: true});
    res.json(updated)
}

exports.deleteCar = async (req, res) => {
    await Car.findByIdAndDelete(req.params.id);
    res.json({message: 'Deleted'});
}