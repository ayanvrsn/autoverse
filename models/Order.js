const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
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

const orderSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true
    },
    items: [orderItemSchema],
    status: {
        type: String, 
        enum: ['pending', 'paid', 'confirmed', 'shipped', 'delivered', 'cancelled'],
        default: 'paid'
    },
    totalAmount: {
        type: Number, 
        required: true
    },
    prepaymentPercent: {
        type: Number,
        default: 5
    },
    prepaymentAmount: {
        type: Number,
        required: true
    },
    stripeSessionId: {
        type: String
    },
    stripePaymentIntentId: {
        type: String
    },
    paidAt: {
        type: Date
    }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
