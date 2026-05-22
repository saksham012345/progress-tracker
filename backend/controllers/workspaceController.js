const Workspace = require('../models/Workspace');
const Message = require('../models/Message');

// Helper: emit real-time event to a specific user
function emitToUser(req, userId, event, payload) {
    try {
        const io = req.app.get('io');
        if (io) io.to(`user:${userId}`).emit(event, payload);
    } catch (e) {}
}

// GET /api/workspaces — workspaces where user is owner or accepted member
exports.getWorkspaces = async (req, res) => {
    try {
        const workspaces = await Workspace.find({
            $or: [{ owner: req.user.id }, { members: req.user.id }]
        })
            .populate('owner', 'username email')
            .populate('members', 'username email');
        res.json(workspaces);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// POST /api/workspaces
exports.createWorkspace = async (req, res) => {
    try {
        const workspace = new Workspace({
            name: req.body.name,
            description: req.body.description,
            owner: req.user.id,
            members: [req.user.id]
        });
        const saved = await workspace.save();
        const populated = await Workspace.findById(saved._id)
            .populate('owner', 'username email')
            .populate('members', 'username email');
        res.status(201).json(populated);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// POST /api/workspaces/:id/invite — owner sends invite to a user
exports.sendInvite = async (req, res) => {
    try {
        const workspace = await Workspace.findById(req.params.id);
        if (!workspace) return res.status(404).json({ message: 'Workspace not found' });
        if (workspace.owner.toString() !== req.user.id)
            return res.status(403).json({ message: 'Only owner can send invites' });

        const { userId } = req.body;

        // Already a member?
        if (workspace.members.map(m => m.toString()).includes(userId))
            return res.status(400).json({ message: 'User is already a member' });

        // Already has a pending invite?
        const existing = workspace.invites.find(
            i => i.to.toString() === userId && i.status === 'pending'
        );
        if (existing) return res.status(400).json({ message: 'Invite already sent' });

        workspace.invites.push({ to: userId, status: 'pending' });
        await workspace.save();

        // Real-time notification to the invited user
        emitToUser(req, userId, 'workspaceInvite', {
            workspaceId: workspace._id,
            workspaceName: workspace.name,
            ownerName: req.body.ownerName || 'Someone'
        });

        res.json({ message: 'Invite sent' });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// GET /api/workspaces/invites — get pending invites for current user
exports.getMyInvites = async (req, res) => {
    try {
        const workspaces = await Workspace.find({
            'invites': { $elemMatch: { to: req.user.id, status: 'pending' } }
        }).populate('owner', 'username email');

        const invites = workspaces.map(ws => ({
            workspaceId: ws._id,
            workspaceName: ws.name,
            workspaceDescription: ws.description,
            ownerUsername: ws.owner?.username,
            inviteId: ws.invites.find(i => i.to.toString() === req.user.id && i.status === 'pending')?._id
        }));

        res.json(invites);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// PATCH /api/workspaces/:id/invites/:inviteId — accept or reject
exports.respondToInvite = async (req, res) => {
    try {
        const { action } = req.body; // 'accept' | 'reject'
        const workspace = await Workspace.findById(req.params.id);
        if (!workspace) return res.status(404).json({ message: 'Workspace not found' });

        const invite = workspace.invites.id(req.params.inviteId);
        if (!invite) return res.status(404).json({ message: 'Invite not found' });
        if (invite.to.toString() !== req.user.id)
            return res.status(403).json({ message: 'Not your invite' });

        invite.status = action === 'accept' ? 'accepted' : 'rejected';

        if (action === 'accept' && !workspace.members.map(m => m.toString()).includes(req.user.id)) {
            workspace.members.push(req.user.id);
        }

        await workspace.save();

        // Notify owner
        emitToUser(req, workspace.owner.toString(), 'inviteResponse', {
            workspaceId: workspace._id,
            workspaceName: workspace.name,
            userId: req.user.id,
            action
        });

        res.json({ message: `Invite ${invite.status}` });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// Keep old addMember for backwards compat (used internally)
exports.addMember = async (req, res) => {
    try {
        const workspace = await Workspace.findById(req.params.id);
        if (!workspace) return res.status(404).json({ message: 'Workspace not found' });
        if (workspace.owner.toString() !== req.user.id)
            return res.status(403).json({ message: 'Only owner can add members' });
        if (!workspace.members.map(m => m.toString()).includes(req.body.userId)) {
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
            .limit(100);
        res.json(messages);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
