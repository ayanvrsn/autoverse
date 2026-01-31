const Order = require('../models/Order');
const Cart = require('../models/Cart');

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
    try {
        const userId = req.user.id;

        const cart = await Cart.findOne({ userId })
            .populate('items.carId')
            .populate('items.configurationId');

        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ message: 'Cart is empty' });
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

        res.status(201).json(populatedOrder);
    } catch (error) {
        res.status(500).json({ message: 'Error creating order', error: error.message });
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
