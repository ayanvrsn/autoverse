require('dotenv').config();
const express = require('express');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const carRoutes = require('./routes/carRoutes');
const configRoutes = require('./routes/configRoutes')
const cartRoutes = require('./routes/cartRoutes')

const app = express();
connectDB();

app.use(express.json());
app.use(express.static('frontend')); 

app.use('/auth', authRoutes);
app.use('/', carRoutes);
app.use('/', configRoutes);
// app.use('/', cartRoutes);


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(` Server: http://localhost:${PORT}`));
