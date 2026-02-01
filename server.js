require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');

const authRoutes = require('./routes/authRoutes');
const carRoutes = require('./routes/carRoutes');
const configRoutes = require('./routes/configRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');

const app = express();

connectDB();

app.use(cors());
app.use(express.json());

app.use('/frontend', express.static(path.join(__dirname, 'frontend')));

app.use('/api/auth', authRoutes);
app.use('/api/cars', carRoutes);
app.use('/api/configs', configRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);

app.get('/', (req, res) => {
    res.redirect('/frontend/index.html');
});

app.use('/api/*', (req, res) => {
    res.status(404).json({ message: 'API endpoint not found' });
});



const PORT = process.env.PORT 
;
app.listen(PORT, () => {
    console.log(`
http:
    `);
});
