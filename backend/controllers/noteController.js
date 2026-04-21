const Note = require('../models/Note');

exports.getNotes = async (req, res) => {
    try {
        const notes = await Note.find({ workspaceId: req.params.workspaceId }).sort({ updatedAt: -1 });
        res.json(notes);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.updateNote = async (req, res) => {
    try {
        const { workspaceId, title, content, topicId } = req.body;
        let note = await Note.findOne({ workspaceId, title }); // Simple find-or-create by title

        if (!note) {
            note = new Note({ workspaceId, title, content, lastUpdatedBy: req.user.id, topicId });
        } else {
            note.content = content;
            note.lastUpdatedBy = req.user.id;
            note.updatedAt = Date.now();
        }

        await note.save();
        res.json(note);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.deleteNote = async (req, res) => {
    try {
        await Note.findByIdAndDelete(req.params.id);
        res.json({ message: 'Note deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
