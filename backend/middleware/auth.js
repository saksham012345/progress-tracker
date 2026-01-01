const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ msg: 'No token, authorization denied' });
        }

        const verified = jwt.verify(
            token,
            process.env.JWT_SECRET || 'fallback_secret_do_not_use_in_prod'
        );

        req.user = verified.id;
        next();
    } catch (err) {
        res.status(401).json({ msg: 'Token is not valid' });
    }
};

module.exports = auth;
