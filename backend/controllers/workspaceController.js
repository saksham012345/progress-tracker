const Workspace = require('../models/Workspace');
const Message = require('../models/Message');

exports.getWorkspaces = async (req, res) => {
    try {
        const workspaces = await Workspace.find({
            $or: [{ owner: req.user.id }, { members: req.user.id }]
        }).populate('owner', 'username');
        res.json(workspaces);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.createWorkspace = async (req, res) => {
    const workspace = new Workspace({
        name: req.body.name,
        description: req.body.description,
        owner: req.user.id,
        members: [req.user.id]
    });

    try {
        const newWorkspace = await workspace.save();
        res.status(201).json(newWorkspace);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.addMember = async (req, res) => {
    try {
        const workspace = await Workspace.findById(req.params.id);
        if (!workspace) return res.status(404).json({ message: 'Workspace not found' });
        
        if (workspace.owner.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Only owner can add members' });
        }

        if (!workspace.members.includes(req.body.userId)) {
            workspace.members.push(req.body.userId);
            await workspace.save();
        }
        res.json(workspace);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.getChatHistory = async (req, res) => {
    try {
        const messages = await Message.find({ workspaceId: req.params.id })
            .sort({ createdAt: 1 })
            .limit(50);
        res.json(messages);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
