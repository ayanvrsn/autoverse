const Config = require('../models/Config');


exports.getConfigs = async (req, res) => {
    const data = await Config.find()
    res.json(data)
}

exports.createConfig = async (req, res) => {
    try {
        const newConfig = new Config(req.body);
        await newConfig.save();
        res.status(201).json(newConfig);
    } catch (err) {
        res.status(400).json({error: err.message})
    }
};

exports.getConfigById = async (req,res) => {
    const item = await Config.findById(req.params.id);
    item ? res.json(item) : res.status(404).send('Not found!')
}

exports.updateConfig = async (req,res) => {
    const updated = await Config.findByIdAndUpdate(req.params.id, req.body, {new: true});
    res.json(updated)
}

exports.deleteConfig = async (req, res) => {
    await Config.findByIdAndDelete(req.params.id);
    res.json({message: 'Deleted'});
}