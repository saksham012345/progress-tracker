const Resource = require('../models/Resource');

exports.getResources = async (req, res) => {
    try {
        const resources = await Resource.find({ workspaceId: req.params.workspaceId }).sort({ createdAt: -1 });
        res.json(resources);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.addResource = async (req, res) => {
    try {
        const { workspaceId, title, url, type } = req.body;
        const resource = new Resource({
            workspaceId,
            title,
            url,
            type,
            addedBy: req.user.id
        });
        await resource.save();
        res.status(201).json(resource);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.deleteResource = async (req, res) => {
    try {
        await Resource.findByIdAndDelete(req.params.id);
        res.json({ message: 'Resource deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
