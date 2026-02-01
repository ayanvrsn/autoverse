const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const { 
    getCart, 
    addItemToCart, 
    removeItem, 
    clearCart 
} = require('../controllers/CartController');

router.get('/', authMiddleware, getCart);
router.post('/', authMiddleware, addItemToCart);
router.delete('/item/:itemIndex', authMiddleware, removeItem);
router.delete('/', authMiddleware, clearCart);

module.exports = router;
