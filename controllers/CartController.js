const Cart = require('../models/Cart')
const Car = require('../models/Car')




exports.addItem = async (res, req) => {
    try {
        const { carId, configurationId, finalPrice} = req.body
        const userId = req.user.id

    let car = Car.findById(carId)
    if (!Car) {
        return res.status(400).json(message:'Car not found')
    }
    let cart = Cart.findOne({userId})

    if (!cart) {
        cart = new Cart({
                userId,
                items: [{ carId, configurationId, finalPrice }]
            });
        } else {
            // Добавляем новый предмет в массив items
            cart.items.push({ carId, configurationId, finalPrice });
        }
    await cart.save()
    res.status(200).json(cart)
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}
 
exports.getCart = async (req, res) => {
    try {
        const cart = await Cart.findOne({ userId: req.user.id })
            .populate('items.carId')
            .populate('items.configurationId');

        if (!cart) {
            return res.status(200).json({ items: [] });
        }

        res.json(cart);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.removeItem = async (req, res) => {
    try {
        const { carId } = req.params;
        const cart = await Cart.findOne({ userId: req.user.id });

        if (cart) {
            // Удаляем первый найденный элемент с таким carId
            cart.items = cart.items.filter(item => item.carId.toString() !== carId);
            await cart.save();
        }

        res.json(cart);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};