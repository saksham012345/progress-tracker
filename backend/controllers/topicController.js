const Topic = require('../models/Topic');
const User = require('../models/User');

// SM-2 spaced repetition algorithm
function calcNextReview(easeFactor, interval, repetitions, quality) {
    // quality: 0-5 (0-2 = fail, 3-5 = pass)
    let newEF = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    if (newEF < 1.3) newEF = 1.3;

    let newInterval;
    let newReps;
    if (quality < 3) {
        newInterval = 1;
        newReps = 0;
    } else {
        newReps = repetitions + 1;
        if (repetitions === 0) newInterval = 1;
        else if (repetitions === 1) newInterval = 6;
        else newInterval = Math.round(interval * newEF);
    }

    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + newInterval);

    return { easeFactor: newEF, interval: newInterval, repetitions: newReps, nextReview };
}

async function awardBadge(user, badgeName, badgeIcon) {
    const already = user.badges.some(b => b.name === badgeName);
    if (!already) {
        user.badges.push({ name: badgeName, icon: badgeIcon });
        return true;
    }
    return false;
}

exports.getTopic = async (req, res) => {
    try {
        const topic = await Topic.findOne({ _id: req.params.id, userId: req.user.id });
        if (!topic) return res.status(404).json({ message: 'Topic not found' });
        res.json(topic);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getTopics = async (req, res) => {
    try {
        // Fix: scope to authenticated user
        const userId = req.user?.id;
        const filter = userId ? { userId } : {};
        const topics = await Topic.find(filter).sort({ createdAt: -1 });
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
        deadline: req.body.deadline || null,
        difficulty: req.body.difficulty || 'Medium',
        userId: req.user.id
    });

    try {
        const newTopic = await topic.save();
        res.status(201).json(newTopic);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.updateTopic = async (req, res) => {
    try {
        const topic = await Topic.findOne({ _id: req.params.id, userId: req.user.id });
        if (!topic) return res.status(404).json({ message: 'Topic not found' });

        const { title, category, goal, deadline, difficulty } = req.body;
        if (title) topic.title = title;
        if (category) topic.category = category;
        if (goal !== undefined) topic.goal = goal;
        if (deadline !== undefined) topic.deadline = deadline || null;
        if (difficulty) topic.difficulty = difficulty;

        const updated = await topic.save();
        res.json(updated);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.deleteTopic = async (req, res) => {
    try {
        await Topic.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
        res.json({ message: 'Topic deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.updateTopicStatus = async (req, res) => {
    try {
        const topic = await Topic.findById(req.params.id);
        if (!topic) return res.status(404).json({ message: 'Topic not found' });

        const ownerId = (topic.userId || '').toString();
        const requesterId = req.user.id;

        if (req.body.status) {
            const oldStatus = topic.status;
            topic.status = req.body.status;

            if (req.body.status === 'Revised' && oldStatus !== 'Revised') {
                const user = await User.findById(ownerId || requesterId);
                if (user) {
                    user.points += 50;
                    user.level = Math.floor(user.points / 200) + 1;

                    // Badge: First Completion
                    await awardBadge(user, 'First Revision', '🎯');

                    // Badge: 10 topics revised
                    const revisedCount = await Topic.countDocuments({ userId: user._id, status: 'Revised' });
                    if (revisedCount >= 10) await awardBadge(user, 'Knowledge Master', '🏆');
                    if (revisedCount >= 5) await awardBadge(user, 'Dedicated Learner', '📚');

                    await user.save();
                }
            }

            // Spaced repetition: when marked Revised, schedule next review
            if (req.body.status === 'Revised') {
                const user = await User.findById(ownerId || requesterId);
                if (user) {
                    const existing = user.topicReviews.find(r => r.topicId.toString() === topic._id.toString());
                    const quality = 4; // default good quality on first revision
                    const ef = existing?.easeFactor || 2.5;
                    const iv = existing?.interval || 1;
                    const reps = existing?.repetitions || 0;
                    const result = calcNextReview(ef, iv, reps, quality);

                    if (existing) {
                        existing.easeFactor = result.easeFactor;
                        existing.interval = result.interval;
                        existing.repetitions = result.repetitions;
                        existing.lastReviewed = new Date();
                        existing.nextReview = result.nextReview;
                    } else {
                        user.topicReviews.push({
                            topicId: topic._id,
                            lastReviewed: new Date(),
                            nextReview: result.nextReview,
                            easeFactor: result.easeFactor,
                            interval: result.interval,
                            repetitions: result.repetitions
                        });
                    }
                    topic.nextReviewDate = result.nextReview;
                    await user.save();
                }
            }
        }

        if (req.body.subTasks) {
            const oldCompleted = topic.subTasks?.filter(st => st.completed).length || 0;
            const newCompleted = req.body.subTasks.filter(st => st.completed).length;

            if (newCompleted > oldCompleted) {
                const pointsEarned = (newCompleted - oldCompleted) * 5;
                const user = await User.findById(ownerId || requesterId);
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

// GET /api/topics/due-review — topics due for spaced repetition review
exports.getDueReviews = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.json([]);

        const now = new Date();
        const dueTopicIds = user.topicReviews
            .filter(r => r.nextReview && new Date(r.nextReview) <= now)
            .map(r => r.topicId);

        const topics = await Topic.find({ _id: { $in: dueTopicIds }, userId: req.user.id });
        res.json(topics);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
