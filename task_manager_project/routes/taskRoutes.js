const express = require('express');
const { createTask } = require('../controllers/taskController'); 
const router = express.Router();


router.post('/tasks', createTask);

module.exports = router;
