const Task = require('../models/taskModel');

// Create a new task
exports.createTask = async (req, res) => {
    const { title, description, dueDate, userId } = req.body;


    try {
        const task = new Task({ title, description, dueDate, userId });
        await task.save();
        res.status(201).json(task);
    } catch (error) {
        console.error(error); 
        res.status(400).json({ message: "Error creating task", error: error.message });
    }
};
