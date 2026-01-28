const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware')
const roleMiddleware = require('../middlewares/roleMiddleware')
const { getConfigs, createConfig, getConfigById, updateConfig, deleteConfig} = require('../controllers/ConfigController')


router.get('/configs' , getConfigs);
router.post('/configs',roleMiddleware(['ADMIN']), createConfig);
router.get('/configs/:id',authMiddleware, getConfigById);
router.put('/configs/:id', roleMiddleware(['ADMIN']),updateConfig);
router.delete('/configs/:id', roleMiddleware(['ADMIN']), deleteConfig);

module.exports = router;
