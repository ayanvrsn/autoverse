const mongoose = require('mongoose'); 

const cartItemSchema = new mongoose.Schema({
    carId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Car', 
        required: true 
    },
    configurationId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Config',
        required: true
    },
    price: { 
        type: Number, 
        required: true 
    }
}, { _id: false });

const cartSchema = new mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true, 
        unique: true 
    },
    items: [cartItemSchema]
}, { timestamps: true });

module.exports = mongoose.model('Cart', cartSchema);
