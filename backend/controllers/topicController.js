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
        goal: req.body.goal,
        userId: req.user?.id // Set owner
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
        const User = require('../models/User');

        if (req.body.status) {
            const oldStatus = topic.status;
            topic.status = req.body.status;

            // Award points for completion (Revised status)
            if (req.body.status === 'Revised' && oldStatus !== 'Revised') {
                const user = await User.findById(topic.userId || req.user.id); // Fallback to auth user
                if (user) {
                    user.points += 50;
                    // Check for level up every 200 points
                    user.level = Math.floor(user.points / 200) + 1;
                    await user.save();
                }
            }
        }

        if (req.body.subTasks) {
            // Compare old subTasks with new ones to award points for newly completed ones
            const oldCompletedCount = topic.subTasks?.filter(st => st.completed).length || 0;
            const newCompletedCount = req.body.subTasks.filter(st => st.completed).length;
            
            if (newCompletedCount > oldCompletedCount) {
                const pointsEarned = (newCompletedCount - oldCompletedCount) * 5;
                const user = await User.findById(topic.userId || req.user.id);
                if (user) {
                    user.points += pointsEarned;
                    user.level = Math.floor(user.points / 200) + 1;
                    await user.save();
                }
            }
            topic.subTasks = req.body.subTasks;
        }

        const updatedTopic = await topic.save();
        res.json(updatedTopic);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};
