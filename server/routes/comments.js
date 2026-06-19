const express = require('express');
const router = express.Router();
const { Comment, User } = require('../models');
const authMiddleware = require('../middleware/auth');

// GET /api/comments/issue/:issueId
router.get('/issue/:issueId', async (req, res) => {
    try {
        const comments = await Comment.findAll({
            where: { issueId: req.params.issueId },
            include: [{
                model: User,
                as: 'author',
                attributes: ['name', 'avatar', 'level', 'role']
            }],
            order: [['createdAt', 'ASC']]
        });
        res.json(comments);
    } catch (err) {
        console.error('Get comments error:', err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /api/comments/issue/:issueId
router.post('/issue/:issueId', authMiddleware, async (req, res) => {
    try {
        const { text } = req.body;
        if (!text || text.trim().length === 0)
            return res.status(400).json({ message: 'Comment text required' });

        const comment = await Comment.create({
            issueId: req.params.issueId,
            authorId: req.user.id,
            text: text.trim(),
            isOfficial: req.user.role === 'admin'
        });

        const populated = await Comment.findByPk(comment.id, {
            include: [{
                model: User,
                as: 'author',
                attributes: ['name', 'avatar', 'level', 'role']
            }]
        });

        res.status(201).json(populated);
    } catch (err) {
        console.error('Post comment error:', err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// DELETE /api/comments/:id
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const comment = await Comment.findByPk(req.params.id);
        if (!comment) return res.status(404).json({ message: 'Comment not found' });
        
        if (comment.authorId.toString() !== req.user.id.toString() && req.user.role !== 'admin')
            return res.status(403).json({ message: 'Not authorized' });

        await comment.destroy();
        res.json({ message: 'Comment deleted' });
    } catch (err) {
        console.error('Delete comment error:', err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
