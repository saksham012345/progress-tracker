const Reminder = require('../models/Reminder');

exports.getReminders = async (req, res) => {
    try {
        const reminders = await Reminder.find({ userId: req.user.id }).sort({ reminderTime: 1 });
        res.json(reminders);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.createReminder = async (req, res) => {
    const { title, message, reminderTime } = req.body;
    
    const reminder = new Reminder({
        userId: req.user.id,
        title,
        message,
        reminderTime
    });

    try {
        const newReminder = await reminder.save();
        res.status(201).json(newReminder);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.deleteReminder = async (req, res) => {
    try {
        await Reminder.findByIdAndDelete(req.params.id);
        res.json({ message: 'Reminder deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.markAsTriggered = async (req, res) => {
    try {
        const reminder = await Reminder.findById(req.params.id);
        if (!reminder) return res.status(404).json({ message: 'Reminder not found' });
        
        reminder.isTriggered = true;
        await reminder.save();
        res.json(reminder);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
