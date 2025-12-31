const Joi = require('joi');

const topicSchema = Joi.object({
    title: Joi.string().min(3).required(),
    category: Joi.string().min(2).required(),
    goal: Joi.string().allow('').optional()
});

const sessionSchema = Joi.object({
    topicId: Joi.string().required(),
    duration: Joi.number().min(1).required(),
    notes: Joi.string().min(5).required(),
    date: Joi.date().optional()
});

exports.validateTopic = (req, res, next) => {
    const { error } = topicSchema.validate(req.body);
    if (error) {
        const msg = error.details.map(el => el.message).join(',');
        return res.status(400).json({ message: msg });
    }
    next();
};

exports.validateSession = (req, res, next) => {
    const { error } = sessionSchema.validate(req.body);
    if (error) {
        const msg = error.details.map(el => el.message).join(',');
        return res.status(400).json({ message: msg });
    }
    next();
};
