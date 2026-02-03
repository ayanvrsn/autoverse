const Order = require('../models/Order');
const Cart = require('../models/Cart');
const User = require('../models/User');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');

const ORDER_CODE_TTL_MS = 60 * 1000; //how many ms

const generateOrderCode = () => String(Math.floor(100000 + Math.random() * 900000));
const hashCode = (code) => crypto.createHash('sha256').update(code).digest('hex');

const buildOrderFromCart = async (userId) => {
    const cart = await Cart.findOne({ userId })
        .populate('items.carId')
        .populate('items.configurationId');

    if (!cart || cart.items.length === 0) {
        return { error: { status: 400, message: 'Cart is empty' } };
    }

    const totalAmount = cart.items.reduce((sum, item) => sum + item.price, 0);

    const order = new Order({
        userId,
        items: cart.items.map(item => ({
            carId: item.carId._id,
            configurationId: item.configurationId._id,
            price: item.price
        })),
        status: 'pending',
        totalAmount
    });

    await order.save();

    cart.items = [];
    await cart.save();

    const populatedOrder = await Order.findById(order._id)
        .populate('items.carId', 'brand model year heroImage')
        .populate('items.configurationId', 'name specs');

    return { order: populatedOrder };
};

exports.getOrders = async (req, res) => {
    try {
        const orders = await Order.find({ userId: req.user.id })
            .populate('items.carId', 'brand model year heroImage')
            .populate('items.configurationId', 'name specs')
            .sort({ createdAt: -1 });

        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching orders', error: error.message });
    }
};

exports.getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find()
            .populate('userId', 'email')
            .populate('items.carId', 'brand model')
            .populate('items.configurationId', 'name')
            .sort({ createdAt: -1 });

        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching orders', error: error.message });
    }
};

exports.getOrderById = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('userId', 'email')
            .populate('items.carId', 'brand model year heroImage basePrice')
            .populate('items.configurationId', 'name priceTotal specs sketchfabEmbedHtml');

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        if (order.userId._id.toString() !== req.user.id && req.user.role !== 'ADMIN') {
            return res.status(403).json({ message: 'Access denied' });
        }

        res.json(order);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching order', error: error.message });
    }
};

exports.createOrder = async (req, res) => {
    return res.status(400).json({
        message: 'Order confirmation code is required. Use /api/orders/checkout/request-code and /api/orders/checkout/confirm.'
    });
};

exports.requestOrderCode = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (!user.isVerified) {
            return res.status(403).json({ message: 'Please verify your email before placing an order' });
        }

        const cart = await Cart.findOne({ userId });
        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ message: 'Cart is empty' });
        }

        const code = generateOrderCode();
        user.orderVerificationCodeHash = hashCode(code);
        user.orderVerificationExpiresAt = new Date(Date.now() + ORDER_CODE_TTL_MS);
        await user.save();

        await sendEmail(
            user.email,
            'Your order confirmation code',
            `<h2>Order confirmation</h2>
             <p>Your confirmation code is:</p>
             <h1 style="letter-spacing:3px;">${code}</h1>
             <p>This code expires in 1 minute.</p>`
        );

        return res.json({ message: 'Confirmation code sent to your email' });
    } catch (error) {
        res.status(500).json({ message: 'Error sending confirmation code', error: error.message });
    }
};

exports.confirmOrder = async (req, res) => {
    try {
        const userId = req.user.id;
        const { code } = req.body;

        if (!code) {
            return res.status(400).json({ message: 'Confirmation code is required' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (!user.orderVerificationCodeHash || !user.orderVerificationExpiresAt) {
            return res.status(400).json({ message: 'Request a confirmation code first' });
        }

        if (new Date() > new Date(user.orderVerificationExpiresAt)) {
            user.orderVerificationCodeHash = null;
            user.orderVerificationExpiresAt = null;
            await user.save();
            return res.status(400).json({ message: 'Confirmation code expired. Request a new one.' });
        }

        const normalizedCode = String(code).trim();
        if (hashCode(normalizedCode) !== user.orderVerificationCodeHash) {
            return res.status(400).json({ message: 'Invalid confirmation code' });
        }

        const { order, error } = await buildOrderFromCart(userId);
        if (error) {
            return res.status(error.status).json({ message: error.message });
        }

        user.orderVerificationCodeHash = null;
        user.orderVerificationExpiresAt = null;
        await user.save();

        return res.status(201).json(order);
    } catch (error) {
        res.status(500).json({ message: 'Error confirming order', error: error.message });
    }
};

exports.updateOrderStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const order = await Order.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        )
        .populate('userId', 'email')
        .populate('items.carId', 'brand model')
        .populate('items.configurationId', 'name');

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        res.json(order);
    } catch (error) {
        res.status(500).json({ message: 'Error updating order', error: error.message });
    }
};
