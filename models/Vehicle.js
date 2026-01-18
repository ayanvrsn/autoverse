const mongoose = require('mongoose');
const VehicleSchema = new mongoose.Schema({
    title: { type: String, required: true },
    price: { type: Number, required: true },
    category: { type: String, required: true },
    specs: {
        range: String,
        hp: Number
    },
    arModelUrl: { type: String, default: "default_model.glb" }
}, { timestamps: true });

module.exports = mongoose.model('Vehicle', VehicleSchema);
