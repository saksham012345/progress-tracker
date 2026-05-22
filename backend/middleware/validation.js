const Joi = require('joi');

const topicSchema = Joi.object({
    title: Joi.string().min(2).required(),
    category: Joi.string().min(1).required(),
    goal: Joi.string().allow('').optional(),
    deadline: Joi.date().allow('', null).optional(),
    difficulty: Joi.string().valid('Easy', 'Medium', 'Hard').optional()
});

const sessionSchema = Joi.object({
    topicId: Joi.string().required(),
    duration: Joi.number().min(1).required(),
    notes: Joi.string().min(1).required(),
    date: Joi.date().optional(),
    mood: Joi.string().valid('Great', 'Good', 'Okay', 'Tired', 'Frustrated').optional(),
    difficulty: Joi.string().valid('Easy', 'Medium', 'Hard').optional()
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
