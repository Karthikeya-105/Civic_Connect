const sequelize = require('../config/database');
const User = require('./User');
const UserBadge = require('./UserBadge');
const Issue = require('./Issue');
const IssueTimeline = require('./IssueTimeline');
const IssueUpvote = require('./IssueUpvote');
const IssueVerification = require('./IssueVerification');
const Comment = require('./Comment');
const CommentLike = require('./CommentLike');
const Notification = require('./Notification');
const Voucher = require('./Voucher');
const VoucherClaim = require('./VoucherClaim');
const GarbageTruck = require('./GarbageTruck');

// User Associations
User.hasMany(UserBadge, { foreignKey: 'userId', as: 'badges' });
UserBadge.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(VoucherClaim, { foreignKey: 'userId', as: 'claims' });
VoucherClaim.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(Issue, { foreignKey: 'reportedById', as: 'reportedIssues' });
Issue.belongsTo(User, { foreignKey: 'reportedById', as: 'reportedBy' });

// Issue Associations
Issue.hasMany(IssueTimeline, { foreignKey: 'issueId', as: 'timeline' });
IssueTimeline.belongsTo(Issue, { foreignKey: 'issueId' });
IssueTimeline.belongsTo(User, { foreignKey: 'updatedById', as: 'updatedBy' });

Issue.hasMany(IssueUpvote, { foreignKey: 'issueId', as: 'issueUpvotes' });
IssueUpvote.belongsTo(Issue, { foreignKey: 'issueId' });
IssueUpvote.belongsTo(User, { foreignKey: 'userId' });

Issue.hasMany(IssueVerification, { foreignKey: 'issueId', as: 'verifications' });
IssueVerification.belongsTo(Issue, { foreignKey: 'issueId' });
IssueVerification.belongsTo(User, { foreignKey: 'userId' });

Issue.belongsTo(Issue, { foreignKey: 'duplicateOfId', as: 'duplicateOf' });

// Comments
Issue.hasMany(Comment, { foreignKey: 'issueId', as: 'comments' });
Comment.belongsTo(Issue, { foreignKey: 'issueId' });

User.hasMany(Comment, { foreignKey: 'authorId', as: 'userComments' });
Comment.belongsTo(User, { foreignKey: 'authorId', as: 'author' });

Comment.hasMany(CommentLike, { foreignKey: 'commentId', as: 'likes' });
CommentLike.belongsTo(Comment, { foreignKey: 'commentId' });
CommentLike.belongsTo(User, { foreignKey: 'userId' });

// Notifications
User.hasMany(Notification, { foreignKey: 'userId', as: 'userNotifications' });
Notification.belongsTo(User, { foreignKey: 'userId' });
Notification.belongsTo(Issue, { foreignKey: 'relatedIssueId', as: 'relatedIssue' });

// Vouchers
Voucher.hasMany(VoucherClaim, { foreignKey: 'voucherId', as: 'claimedBy' });
VoucherClaim.belongsTo(Voucher, { foreignKey: 'voucherId' });

module.exports = {
    sequelize,
    User,
    UserBadge,
    Issue,
    IssueTimeline,
    IssueUpvote,
    IssueVerification,
    Comment,
    CommentLike,
    Notification,
    Voucher,
    VoucherClaim,
    GarbageTruck
};
