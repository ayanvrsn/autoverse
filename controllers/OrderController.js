const Order = require('../models/Order');
const Cart = require('../models/Cart');
const User = require('../models/User');
const Stripe = require('stripe');

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null;
const PREPAYMENT_PERCENT = 5;

const getAppBaseUrl = () => process.env.APP_URL || `http://localhost:${process.env.PORT || 3003}`;
const getFrontendBaseUrl = () => process.env.FRONTEND_URL || `${getAppBaseUrl()}/frontend`;

const buildOrderFromCart = async (userId) => {
    const cart = await Cart.findOne({ userId })
        .populate('items.carId')
        .populate('items.configurationId');

    if (!cart || cart.items.length === 0) {
        return { error: { status: 400, message: 'Cart is empty' } };
    }

    const totalAmount = cart.items.reduce((sum, item) => sum + item.price, 0);
    const prepaymentAmount = Math.round((totalAmount * PREPAYMENT_PERCENT) * 100) / 100;

    const order = new Order({
        userId,
        items: cart.items.map(item => ({
            carId: item.carId._id,
            configurationId: item.configurationId._id,
            price: item.price
        })),
        status: 'paid',
        totalAmount,
        prepaymentPercent: PREPAYMENT_PERCENT,
        prepaymentAmount,
        paidAt: new Date()
    });

    await order.save();

    cart.items = [];
    await cart.save();

    const populatedOrder = await Order.findById(order._id)
        .populate('items.carId', 'brand model year heroImage')
        .populate('items.configurationId', 'name specs');

    return { order: populatedOrder };
};

const calculatePrepaymentCents = (subtotal) => Math.round(subtotal * (PREPAYMENT_PERCENT / 100) * 100);

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
        message: 'Stripe Checkout is required. Use /api/orders/checkout/session and /api/orders/checkout/confirm.'
    });
};

exports.createStripeCheckoutSession = async (req, res) => {
    try {
        if (!stripe) {
            return res.status(503).json({ message: 'Stripe is not configured' });
        }

        const userId = req.user.id;
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (!user.isVerified) {
            return res.status(403).json({ message: 'Please verify your email before placing an order' });
        }

        const cart = await Cart.findOne({ userId })
            .populate('items.carId')
            .populate('items.configurationId');

        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ message: 'Cart is empty' });
        }

        const subtotal = cart.items.reduce((sum, item) => sum + (item.price || 0), 0);
        const prepaymentCents = calculatePrepaymentCents(subtotal);

        if (prepaymentCents <= 0) {
            return res.status(400).json({ message: 'Invalid prepayment amount' });
        }

        const appBaseUrl = getAppBaseUrl();
        const frontendBaseUrl = getFrontendBaseUrl().replace(/\/$/, '');

        const session = await stripe.checkout.sessions.create({
            mode: 'payment',
            payment_method_types: ['card'],
            line_items: [
                {
                    quantity: 1,
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: `Prepayment ${PREPAYMENT_PERCENT}%`,
                            description: 'Prepayment to reserve your car order'
                        },
                        unit_amount: prepaymentCents
                    }
                }
            ],
            success_url: `${frontendBaseUrl}/payment-success.html?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${frontendBaseUrl}/cart.html?stripe_cancelled=1`,
            metadata: {
                userId,
                subtotal: String(subtotal),
                prepaymentCents: String(prepaymentCents)
            }
        });

        return res.json({
            url: session.url,
            sessionId: session.id,
            prepaymentAmount: prepaymentCents / 100,
            prepaymentPercent: PREPAYMENT_PERCENT
        });
    } catch (error) {
        return res.status(500).json({ message: 'Error creating Stripe session', error: error.message });
    }
};

exports.confirmStripeCheckout = async (req, res) => {
    try {
        if (!stripe) {
            return res.status(503).json({ message: 'Stripe is not configured' });
        }

        const { sessionId } = req.body;
        if (!sessionId) {
            return res.status(400).json({ message: 'Stripe session ID is required' });
        }

        const userId = req.user.id;
        const session = await stripe.checkout.sessions.retrieve(sessionId, {
            expand: ['payment_intent']
        });

        if (session.payment_status !== 'paid') {
            return res.status(400).json({ message: 'Stripe payment not completed' });
        }

        if (session.metadata?.userId && session.metadata.userId !== userId) {
            return res.status(403).json({ message: 'Stripe session does not belong to this user' });
        }

        const cart = await Cart.findOne({ userId })
            .populate('items.carId')
            .populate('items.configurationId');

        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ message: 'Cart is empty' });
        }

        const subtotal = cart.items.reduce((sum, item) => sum + (item.price || 0), 0);
        const expectedPrepaymentCents = calculatePrepaymentCents(subtotal);

        if ((session.amount_total || 0) !== expectedPrepaymentCents) {
            return res.status(400).json({
                message: 'Stripe payment amount does not match current cart prepayment'
            });
        }

        const alreadyPaid = await Order.findOne({ stripeSessionId: session.id });
        if (alreadyPaid) {
            return res.json(alreadyPaid);
        }

        const { order, error } = await buildOrderFromCart(userId);
        if (error) {
            return res.status(error.status).json({ message: error.message });
        }

        order.stripeSessionId = session.id;
        order.stripePaymentIntentId = session.payment_intent?.id || null;
        order.prepaymentAmount = (session.amount_total || 0) / 100;
        order.prepaymentPercent = PREPAYMENT_PERCENT;
        order.status = 'paid';
        order.paidAt = new Date();
        await order.save();

        return res.status(201).json(order);
    } catch (error) {
        return res.status(500).json({ message: 'Error confirming Stripe payment', error: error.message });
    }
};

exports.updateOrderStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = ['pending', 'paid', 'confirmed', 'shipped', 'delivered', 'cancelled'];

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
