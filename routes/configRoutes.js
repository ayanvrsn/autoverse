const express = require('express');
const router = express.Router();
const roleMiddleware = require('../middlewares/roleMiddleware');
const { 
    getConfigs, 
    createConfig, 
    getConfigById, 
    updateConfig, 
    deleteConfig 
} = require('../controllers/ConfigController');

// Get all configs (Admin view)
router.get('/', roleMiddleware(['ADMIN']), getConfigs);
router.get('/:id', roleMiddleware(['ADMIN']), getConfigById);

// Admin only routes
router.post('/', roleMiddleware(['ADMIN']), createConfig);
router.put('/:id', roleMiddleware(['ADMIN']), updateConfig);
router.delete('/:id', roleMiddleware(['ADMIN']), deleteConfig);

module.exports = router;
