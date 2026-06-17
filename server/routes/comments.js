const express = require('express');
const router = express.Router();
const Comment = require('../models/Comment');
const authMiddleware = require('../middleware/auth');

// GET /api/comments/issue/:issueId
router.get('/issue/:issueId', async (req, res) => {
    try {
        const comments = await Comment.find({ issue: req.params.issueId })
            .populate('author', 'name avatar level role')
            .sort('createdAt');
        res.json(comments);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /api/comments/issue/:issueId
router.post('/issue/:issueId', authMiddleware, async (req, res) => {
    try {
        const { text } = req.body;
        if (!text || text.trim().length === 0)
            return res.status(400).json({ message: 'Comment text required' });

        const comment = new Comment({
            issue: req.params.issueId,
            author: req.user.id,
            text: text.trim(),
            isOfficial: req.user.role === 'admin'
        });
        await comment.save();
        await comment.populate('author', 'name avatar level role');
        res.status(201).json(comment);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// DELETE /api/comments/:id
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const comment = await Comment.findById(req.params.id);
        if (!comment) return res.status(404).json({ message: 'Comment not found' });
        if (comment.author.toString() !== req.user.id && req.user.role !== 'admin')
            return res.status(403).json({ message: 'Not authorized' });
        await comment.deleteOne();
        res.json({ message: 'Comment deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
