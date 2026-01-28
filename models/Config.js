const mongoose = require('mongoose');
const ConfigSchema = new mongoose.Schema({
    carId: {type: mongoose.Schema.Types.ObjectId, ref: 'Car', required: true},
    engine: {type: String, required: true},
    color: {type: String, required: true},
    interior: {type: String, required: true},
    priceAddition: {type: Number, required: true}
}, {timestamps: true});

module.exports = mongoose.model('Config', ConfigSchema);
