const mongoose = require('mongoose');

const ConfigSchema = new mongoose.Schema({
    carId: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Car', 
        required: true
    },
    name: {
        type: String,
        required: true,
        enum: ['Base', 'Performance', 'Premium', 'Sport', 'Off-road', 'Luxury']
    },
    priceTotal: {
        type: Number, 
        required: true
    },
    sketchfabEmbedHtml: {
        type: String,
        required: true
    },
    specs: {
        engine: { type: String, required: true },
        color: { type: String, required: true },
        interior: { type: String, required: true }
    }
}, { timestamps: true });

module.exports = mongoose.model('Config', ConfigSchema);
