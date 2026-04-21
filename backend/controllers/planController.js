const Plan = require('../models/Plan');

exports.getPlans = async (req, res) => {
    try {
        const plans = await Plan.find({ userId: req.user.id }).sort({ createdAt: -1 });
        res.json(plans);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.savePlan = async (req, res) => {
    const { title, content, topics, goals, hoursPerWeek } = req.body;

    if (!content) {
        return res.status(400).json({ message: 'Plan content is required' });
    }

    const plan = new Plan({
        userId: req.user.id,
        title: title || 'Study Plan',
        content,
        topics: topics || [],
        goals: goals || '',
        hoursPerWeek: hoursPerWeek || 0
    });

    try {
        const saved = await plan.save();
        res.status(201).json(saved);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.deletePlan = async (req, res) => {
    try {
        const plan = await Plan.findById(req.params.id);
        if (!plan) return res.status(404).json({ message: 'Plan not found' });
        if (plan.userId.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized' });
        }
        await Plan.findByIdAndDelete(req.params.id);
        res.json({ message: 'Plan deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
