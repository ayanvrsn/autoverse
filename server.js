require('dotenv').config();
const express = require('express');
const connectDB = require('./config/db');
const vehicleRoutes = require('./routes/vehicleRoutes');

const app = express();
connectDB();

app.use(express.json());
app.use(express.static('frontend')); 

app.use('/api/vehicles', vehicleRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server: http://localhost:${PORT}`));
