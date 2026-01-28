const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    userId: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required:true},
    cartId: {type: String, required:true},
    status: {type: String, required:true},
    totalAmount: {type: Number, required:true},
    createdAt: {type: Date, required:true}

}, {timestamps: true});

module.exports = mongoose.model('Order', orderSchema);