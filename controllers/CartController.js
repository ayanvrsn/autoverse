const Cart = require('../models/Cart');
const Car = require('../models/Car');
const Config = require('../models/Config');

exports.getCart = async (req, res) => {
    try {
        let cart = await Cart.findOne({ userId: req.user.id })
            .populate('items.carId', 'brand model year heroImage')
            .populate('items.configurationId', 'name priceTotal specs');

        if (!cart) {
            cart = { userId: req.user.id, items: [] };
        }

        res.json(cart);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching cart', error: error.message });
    }
};

exports.addItemToCart = async (req, res) => {
    try {
        const { carId, configurationId } = req.body;
        const userId = req.user.id;

        const car = await Car.findById(carId);
        if (!car) {
            return res.status(404).json({ message: 'Car not found' });
        }

        const config = await Config.findOne({ _id: configurationId, carId });
        if (!config) {
            return res.status(404).json({ message: 'Configuration not found for this car' });
        }

        let cart = await Cart.findOne({ userId });
        if (!cart) {
            cart = new Cart({ userId, items: [] });
        }

        const existingItem = cart.items.find(
            item => item.carId.toString() === carId && 
                    item.configurationId.toString() === configurationId
        );

        if (existingItem) {
            return res.status(400).json({ message: 'Item already in cart' });
        }

        cart.items.push({
            carId,
            configurationId,
            price: config.priceTotal
        });

        await cart.save();
        
        cart = await Cart.findOne({ userId })
            .populate('items.carId', 'brand model year heroImage')
            .populate('items.configurationId', 'name priceTotal specs');

        res.status(201).json(cart);
    } catch (error) {
        res.status(500).json({ message: 'Error adding item to cart', error: error.message });
    }
};

exports.removeItem = async (req, res) => {
    try {
        const { itemIndex } = req.params;
        const userId = req.user.id;

        const cart = await Cart.findOne({ userId });
        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }

        const index = parseInt(itemIndex);
        if (index < 0 || index >= cart.items.length) {
            return res.status(400).json({ message: 'Invalid item index' });
        }

        cart.items.splice(index, 1);
        await cart.save();

        const updatedCart = await Cart.findOne({ userId })
            .populate('items.carId', 'brand model year heroImage')
            .populate('items.configurationId', 'name priceTotal specs');

        res.json(updatedCart);
    } catch (error) {
        res.status(500).json({ message: 'Error removing item from cart', error: error.message });
    }
};

exports.clearCart = async (req, res) => {
    try {
        const userId = req.user.id;

        const cart = await Cart.findOne({ userId });
        if (cart) {
            cart.items = [];
            await cart.save();
        }

        res.json({ message: 'Cart cleared', items: [] });
    } catch (error) {
        res.status(500).json({ message: 'Error clearing cart', error: error.message });
    }
};
