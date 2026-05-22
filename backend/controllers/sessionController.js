const Session = require('../models/Session');
const Topic = require('../models/Topic');
const User = require('../models/User');

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
        // Scope to user's own topics
        const userTopics = await Topic.find({ userId: req.user?.id }).select('_id');
        const topicIds = userTopics.map(t => t._id);
        const sessions = await Session.find({ topicId: { $in: topicIds } })
            .populate('topicId', 'title category')
            .sort({ date: -1 });
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
        mood: req.body.mood || 'Good',
        difficulty: req.body.difficulty || 'Medium',
        date: req.body.date || Date.now()
    });

    try {
        const newSession = await session.save();

        // Update topic total study time
        await Topic.findByIdAndUpdate(req.body.topicId, {
            $inc: { totalStudyMinutes: parseInt(req.body.duration) || 0 }
        });

        // Award XP for logging a session (1 XP per minute, max 60 per session)
        const topic = await Topic.findById(req.body.topicId);
        if (topic?.userId) {
            const xp = Math.min(60, Math.floor(parseInt(req.body.duration) / 1));
            const user = await User.findById(topic.userId);
            if (user) {
                user.points += xp;
                user.level = Math.floor(user.points / 200) + 1;

                // Badge: First session
                const sessionCount = await Session.countDocuments({ topicId: { $in: (await Topic.find({ userId: user._id }).select('_id')).map(t => t._id) } });
                if (sessionCount === 1) {
                    user.badges.push({ name: 'First Session', icon: '⚡' });
                }
                // Badge: 10 hours total
                const totalMins = await Session.aggregate([
                    { $match: { topicId: { $in: (await Topic.find({ userId: user._id }).select('_id')).map(t => t._id) } } },
                    { $group: { _id: null, total: { $sum: '$duration' } } }
                ]);
                if (totalMins[0]?.total >= 600) {
                    const already = user.badges.some(b => b.name === '10 Hour Club');
                    if (!already) user.badges.push({ name: '10 Hour Club', icon: '🕐' });
                }

                await user.save();
            }
        }

        res.status(201).json(newSession);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.deleteSession = async (req, res) => {
    try {
        const session = await Session.findById(req.params.id);
        if (!session) return res.status(404).json({ message: 'Session not found' });
        await Topic.findByIdAndUpdate(session.topicId, {
            $inc: { totalStudyMinutes: -session.duration }
        });
        await Session.findByIdAndDelete(req.params.id);
        res.json({ message: 'Session deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.updateSessionNotes = async (req, res) => {
    try {
        const session = await Session.findByIdAndUpdate(
            req.params.id,
            { notes: req.body.notes },
            { new: true }
        );
        if (!session) return res.status(404).json({ message: 'Session not found' });
        res.json(session);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
