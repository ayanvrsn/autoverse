const mongoose = require('mongoose');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Car = require('../models/Car');


exports.createOrder = async (req, res) => {
    // Начинаем сессию для транзакции (ACID)
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const userId = req.user.id;

        const cart = await Cart.findOne({ userId }).populate('items.carId');
        
        if (!cart || cart.items.length === 0) {
            throw new Error('Cart is empty or not found');
        }

        // 2. Проверка доступности и формирование снимков (snapshots)
        let totalAmount = 0;
        const orderItems = cart.items.map(item => {
            const car = item.carId;

            if (!car || !car.available) {
                throw new Error(`Vehicle ${car ? car.model : 'Unknown'} is no longer available`);
            }

            totalAmount += item.finalPrice;

            // Возвращаем объект-снимок, который не зависит от будущих изменений в модели Car
            return {
                carId: car._id,
                brand: car.brand,
                model: car.model,
                finalPrice: item.finalPrice,
                // Если есть конфигурация, её данные также копируются сюда
                configurationId: item.configurationId 
            };
        });

        const newOrder = await Order.create([{
            userId,
            items: orderItems,
            totalAmount,
            status: 'pending'
        }], { session });

        // 4. Очистка корзины после успешного создания заказа
        await Cart.findOneAndUpdate(
            { userId }, 
            { $set: { items: [] } }, 
            { session }
        );

        // Фиксируем все изменения в БД
        await session.commitTransaction();
        
        res.status(201).json({
            success: true,
            data: newOrder[0] // Mongoose возвращает массив при создании через сессию
        });

    } catch (error) {
        // Если что-то пошло не так, отменяем все изменения (rollback)
        await session.abortTransaction();
        res.status(400).json({
            success: false,
            message: error.message
        });
    } finally {
        session.endSession();
    }
};