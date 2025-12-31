const Topic = require('../models/Topic');

exports.getTopics = async (req, res) => {
    try {
        const topics = await Topic.find().sort({ createdAt: -1 });
        res.json(topics);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.createTopic = async (req, res) => {
    const topic = new Topic({
        title: req.body.title,
        category: req.body.category,
        goal: req.body.goal
    });

    try {
        const newTopic = await topic.save();
        res.status(201).json(newTopic);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.deleteTopic = async (req, res) => {
    try {
        await Topic.findByIdAndDelete(req.params.id);
        res.json({ message: 'Topic deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.updateTopicStatus = async (req, res) => {
    try {
        const topic = await Topic.findById(req.params.id);
        if (req.body.status) {
            topic.status = req.body.status;
        }
        const updatedTopic = await topic.save();
        res.json(updatedTopic);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};
