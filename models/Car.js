const mongoose = require('mongoose');

const carSchema = new mongoose.Schema({
    brand: { 
        type: String, 
        required: true
    },
    model: { 
        type: String, 
        required: true
    },
    year: { 
        type: Number, 
        required: true
    },
    basePrice: { 
        type: Number, 
        required: true
    },
    heroImage: {
        type: String,
        required: true
    },
    available: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Car', carSchema);
