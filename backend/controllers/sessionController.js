const Session = require('../models/Session');

exports.getSessions = async (req, res) => {
    try {
        const filter = req.params.topicId ? { topicId: req.params.topicId } : {};
        const sessions = await Session.find(filter).sort({ date: -1 });
        res.json(sessions);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getAllSessions = async (req, res) => {
    try {
        const sessions = await Session.find().populate('topicId');
        res.json(sessions);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.addSession = async (req, res) => {
    const session = new Session({
        topicId: req.body.topicId,
        duration: req.body.duration,
        notes: req.body.notes,
        date: req.body.date || Date.now()
    });

    try {
        const newSession = await session.save();
        res.status(201).json(newSession);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};
