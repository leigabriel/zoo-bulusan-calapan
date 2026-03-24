const Community = require('../models/community-model');
const Notification = require('../models/notification-model');
const { deleteFromCloudinary, extractPublicId } = require('../middleware/cloudinary-upload');

const sanitizeText = (value, maxLength = 2000) => {
    if (typeof value !== 'string') return '';
    return value.replace(/\s+/g, ' ').trim().slice(0, maxLength);
};

const normalizePost = (post) => ({
    id: post.id,
    userId: post.user_id,
    content: post.content,
    imageUrl: post.image_url,
    status: post.status,
    moderationNote: post.moderation_note || null,
    createdAt: post.created_at,
    updatedAt: post.updated_at,
    commentCount: Number(post.comment_count || 0),
    likeCount: Number(post.like_count || 0),
    likedByViewer: Boolean(post.liked_by_viewer),
    author: {
        id: post.user_id,
        firstName: post.first_name,
        lastName: post.last_name,
        username: post.username,
        profileImage: post.profile_image
    }
});

const normalizeComment = (comment) => ({
    id: comment.id,
    postId: comment.post_id,
    parentCommentId: comment.parent_comment_id || null,
    userId: comment.user_id,
    commentText: comment.comment_text,
    isReported: Boolean(comment.is_reported),
    heartCount: Number(comment.heart_count || 0),
    heartedByViewer: Boolean(comment.hearted_by_viewer),
    isHearted: Boolean(comment.hearted_by_viewer),
    createdAt: comment.created_at,
    updatedAt: comment.updated_at,
    author: {
        id: comment.user_id,
        firstName: comment.first_name,
        lastName: comment.last_name,
        username: comment.username,
        profileImage: comment.profile_image
    }
});

const normalizeReportedComment = (report) => ({
    reportId: report.report_id,
    commentId: report.comment_id,
    reportedBy: report.reported_by,
    reason: report.reason,
    status: report.status,
    reportedAt: report.reported_at,
    commentText: report.comment_text,
    commentUserId: report.comment_user_id,
    isReported: Boolean(report.is_reported),
    postId: report.post_id,
    postContent: report.post_content,
    commentAuthor: {
        firstName: report.comment_first_name,
        lastName: report.comment_last_name,
        username: report.comment_username,
        profileImage: report.comment_profile_image
    },
    reporter: {
        firstName: report.reporter_first_name,
        lastName: report.reporter_last_name,
        username: report.reporter_username
    }
});

const createAdminStaffNotifications = async ({ title, message, type = 'community', link = '/admin/community-moderation' }) => {
    try {
        const userIds = await Community.getAdminAndStaffUserIds();
        await Promise.all(
            userIds.map((userId) =>
                Notification.create({
                    userId,
                    title,
                    message,
                    type,
                    link
                })
            )
        );
    } catch (error) {
        console.error('Error creating admin/staff community notifications:', error);
    }
};

exports.getPublicPosts = async (req, res) => {
    try {
        await Community.initializeTables();
        const posts = await Community.getPublicPosts(req.user?.id || null);
        return res.json({
            success: true,
            posts: posts.map(normalizePost)
        });
    } catch (error) {
        console.error('Error fetching community posts:', error);
        return res.status(500).json({ success: false, message: 'Could not load community posts right now.' });
    }
};

exports.createPost = async (req, res) => {
    try {
        await Community.initializeTables();
        const content = sanitizeText(req.body.content, 3000);

        if (!content) {
            return res.status(400).json({ success: false, message: 'Please write something before posting.' });
        }

        const imageUrl = req.cloudinaryResult?.secure_url || null;
        const imagePublicId = req.cloudinaryResult?.public_id || null;

        const postId = await Community.createPost({
            userId: req.user.id,
            content,
            imageUrl,
            imagePublicId
        });

        await createAdminStaffNotifications({
            title: 'New Community Post',
            message: 'A new community post was submitted and is awaiting review.',
            link: '/admin/community-moderation'
        });

        return res.status(201).json({
            success: true,
            message: 'Your post was submitted for review.',
            postId
        });
    } catch (error) {
        console.error('Error creating community post:', error);
        return res.status(500).json({ success: false, message: 'Could not submit your post right now.' });
    }
};

exports.updatePost = async (req, res) => {
    try {
        await Community.initializeTables();
        const postId = Number(req.params.postId);
        if (!postId) {
            return res.status(400).json({ success: false, message: 'Invalid post request.' });
        }

        const currentPost = await Community.getPostById(postId);
        if (!currentPost) {
            return res.status(404).json({ success: false, message: 'Post not found.' });
        }
        if (currentPost.user_id !== req.user.id) {
            return res.status(403).json({ success: false, message: 'You can only edit your own post.' });
        }

        const content = sanitizeText(req.body.content, 3000);
        if (!content) {
            return res.status(400).json({ success: false, message: 'Please write something before updating.' });
        }

        let imageUrl = currentPost.image_url;
        let imagePublicId = currentPost.image_public_id || extractPublicId(currentPost.image_url);
        const removeImage = String(req.body.removeImage || 'false') === 'true';

        if (req.cloudinaryResult?.secure_url) {
            if (imagePublicId) {
                await deleteFromCloudinary(imagePublicId);
            }
            imageUrl = req.cloudinaryResult.secure_url;
            imagePublicId = req.cloudinaryResult.public_id;
        } else if (removeImage) {
            if (imagePublicId) {
                await deleteFromCloudinary(imagePublicId);
            }
            imageUrl = null;
            imagePublicId = null;
        }

        const updated = await Community.updatePostByOwner(postId, req.user.id, {
            content,
            imageUrl,
            imagePublicId
        });

        if (!updated) {
            return res.status(404).json({ success: false, message: 'Post not found.' });
        }

        await createAdminStaffNotifications({
            title: 'Community Post Updated',
            message: 'A community post was updated and returned to moderation review.',
            link: '/admin/community-moderation'
        });

        return res.json({
            success: true,
            message: 'Post updated and sent back for review.'
        });
    } catch (error) {
        console.error('Error updating community post:', error);
        return res.status(500).json({ success: false, message: 'Could not update your post right now.' });
    }
};

exports.deletePost = async (req, res) => {
    try {
        await Community.initializeTables();
        const postId = Number(req.params.postId);
        if (!postId) {
            return res.status(400).json({ success: false, message: 'Invalid post request.' });
        }

        const currentPost = await Community.getPostById(postId);
        if (!currentPost) {
            return res.status(404).json({ success: false, message: 'Post not found.' });
        }

        const isModerator = ['admin', 'staff'].includes(req.user?.role);

        if (!isModerator && currentPost.user_id !== req.user.id) {
            return res.status(403).json({ success: false, message: 'You can only delete your own post.' });
        }

        if (currentPost.image_public_id || currentPost.image_url) {
            const publicId = currentPost.image_public_id || extractPublicId(currentPost.image_url);
            if (publicId) {
                await deleteFromCloudinary(publicId);
            }
        }

        const deleted = isModerator
            ? await Community.deletePostById(postId)
            : await Community.deletePostByOwner(postId, req.user.id);
        if (!deleted) {
            return res.status(404).json({ success: false, message: 'Post not found.' });
        }

        return res.json({ success: true, message: 'Post deleted successfully.' });
    } catch (error) {
        console.error('Error deleting community post:', error);
        return res.status(500).json({ success: false, message: 'Could not delete your post right now.' });
    }
};

exports.getAllPostsForModeration = async (req, res) => {
    try {
        await Community.initializeTables();
        const posts = await Community.getAllPostsForModeration();
        return res.json({
            success: true,
            posts: posts.map(normalizePost)
        });
    } catch (error) {
        console.error('Error getting all posts for moderation:', error);
        return res.status(500).json({ success: false, message: 'Could not load posts right now.' });
    }
};

exports.getPendingPosts = async (req, res) => {
    try {
        await Community.initializeTables();
        const posts = await Community.getPendingPosts();
        return res.json({
            success: true,
            posts: posts.map(normalizePost)
        });
    } catch (error) {
        console.error('Error getting pending posts:', error);
        return res.status(500).json({ success: false, message: 'Could not load pending posts right now.' });
    }
};

exports.reviewPost = async (req, res) => {
    try {
        await Community.initializeTables();
        const postId = Number(req.params.postId);
        const action = String(req.body.action || '').toLowerCase();
        const moderationNote = sanitizeText(req.body.note || '', 255);

        if (!postId || !['approved', 'declined'].includes(action)) {
            return res.status(400).json({ success: false, message: 'Invalid moderation request.' });
        }

        if (action === 'declined' && !moderationNote) {
            return res.status(400).json({ success: false, message: 'Please provide a reason for declining this post.' });
        }

        const post = await Community.getPostByIdWithAuthor(postId);
        if (!post) {
            return res.status(404).json({ success: false, message: 'Post not found.' });
        }

        const updated = await Community.moderatePost(postId, req.user.id, action, moderationNote || null);
        if (!updated) {
            return res.status(404).json({ success: false, message: 'Post not found.' });
        }

        try {
            await Notification.create({
                userId: post.user_id,
                title: action === 'approved' ? 'Post Approved' : 'Post Declined',
                message: action === 'approved'
                    ? 'Your community post has been approved and is now visible to others.'
                    : `Your community post was declined. Reason: ${moderationNote}`,
                type: 'community',
                link: '/community'
            });
        } catch (error) {
            console.error('Error notifying post owner after moderation:', error);
        }

        return res.json({
            success: true,
            message: action === 'approved' ? 'Post approved successfully.' : 'Post declined successfully.'
        });
    } catch (error) {
        console.error('Error reviewing post:', error);
        return res.status(500).json({ success: false, message: 'Could not complete moderation right now.' });
    }
};

exports.getCommentsByPost = async (req, res) => {
    try {
        await Community.initializeTables();
        const postId = Number(req.params.postId);
        if (!postId) {
            return res.status(400).json({ success: false, message: 'Invalid post request.' });
        }

        const comments = await Community.getCommentsByPost(postId, req.user?.id || null);
        return res.json({
            success: true,
            comments: comments.map(normalizeComment)
        });
    } catch (error) {
        console.error('Error loading comments:', error);
        return res.status(500).json({ success: false, message: 'Could not load comments right now.' });
    }
};

exports.createComment = async (req, res) => {
    try {
        await Community.initializeTables();
        const postId = Number(req.params.postId);
        const commentText = sanitizeText(req.body.commentText, 1200);
        const parentCommentId = req.body.parentCommentId ? Number(req.body.parentCommentId) : null;

        if (!postId || !commentText) {
            return res.status(400).json({ success: false, message: 'Please write a comment before posting.' });
        }

        const post = await Community.getPostById(postId);
        if (!post || post.status !== 'approved') {
            return res.status(404).json({ success: false, message: 'This post is not available for comments.' });
        }

        if (parentCommentId) {
            const parentComment = await Community.getCommentById(parentCommentId);
            if (!parentComment || parentComment.post_id !== postId) {
                return res.status(400).json({ success: false, message: 'Invalid reply target.' });
            }
        }

        const postWithAuthor = await Community.getPostByIdWithAuthor(postId);

        const commentId = await Community.createComment({ postId, parentCommentId, userId: req.user.id, commentText });

        await createAdminStaffNotifications({
            title: 'New Community Comment',
            message: 'A new comment was posted in the community.',
            link: '/admin/community-moderation'
        });

        if (postWithAuthor && postWithAuthor.user_id !== req.user.id) {
            try {
                await Notification.create({
                    userId: postWithAuthor.user_id,
                    title: 'New Comment on Your Post',
                    message: `${req.user.firstName || req.user.username || 'A user'} commented on your post.`,
                    type: 'community',
                    link: '/community'
                });
            } catch (error) {
                console.error('Error creating user comment notification:', error);
            }
        }

        return res.status(201).json({ success: true, message: 'Comment added successfully.', commentId });
    } catch (error) {
        console.error('Error creating comment:', error);
        return res.status(500).json({ success: false, message: 'Could not add your comment right now.' });
    }
};

exports.togglePostLike = async (req, res) => {
    try {
        await Community.initializeTables();
        const postId = Number(req.params.postId);
        if (!postId) {
            return res.status(400).json({ success: false, message: 'Invalid like request.' });
        }

        const post = await Community.getPostById(postId);
        if (!post) {
            return res.status(404).json({ success: false, message: 'Post not found.' });
        }

        if (post.status !== 'approved') {
            return res.status(403).json({ success: false, message: 'You can only like approved posts.' });
        }

        const result = await Community.togglePostLike(postId, req.user.id);
        return res.json({
            success: true,
            liked: result.liked,
            likeCount: result.likeCount,
            message: result.liked ? 'Post liked.' : 'Like removed.'
        });
    } catch (error) {
        console.error('Error toggling post like:', error);
        return res.status(500).json({ success: false, message: 'Could not update the post like right now.' });
    }
};

exports.updateComment = async (req, res) => {
    try {
        await Community.initializeTables();
        const commentId = Number(req.params.commentId);
        const commentText = sanitizeText(req.body.commentText, 1200);

        if (!commentId || !commentText) {
            return res.status(400).json({ success: false, message: 'Please write a comment before updating.' });
        }

        const updated = await Community.updateCommentByOwner(commentId, req.user.id, commentText);
        if (!updated) {
            return res.status(404).json({ success: false, message: 'Comment not found or access denied.' });
        }

        return res.json({ success: true, message: 'Comment updated successfully.' });
    } catch (error) {
        console.error('Error updating comment:', error);
        return res.status(500).json({ success: false, message: 'Could not update your comment right now.' });
    }
};

exports.deleteComment = async (req, res) => {
    try {
        await Community.initializeTables();
        const commentId = Number(req.params.commentId);
        if (!commentId) {
            return res.status(400).json({ success: false, message: 'Invalid comment request.' });
        }

        const comment = await Community.getCommentById(commentId);
        if (!comment) {
            return res.status(404).json({ success: false, message: 'Comment not found.' });
        }

        const isModerator = ['admin', 'staff'].includes(req.user?.role);
        if (!isModerator && comment.user_id !== req.user.id) {
            return res.status(403).json({ success: false, message: 'You can only delete your own comment.' });
        }

        const deleted = isModerator
            ? await Community.deleteCommentById(commentId)
            : await Community.deleteCommentByOwner(commentId, req.user.id);
        if (!deleted) {
            return res.status(404).json({ success: false, message: 'Comment not found.' });
        }

        return res.json({ success: true, message: 'Comment deleted successfully.' });
    } catch (error) {
        console.error('Error deleting comment:', error);
        return res.status(500).json({ success: false, message: 'Could not delete your comment right now.' });
    }
};

exports.toggleCommentHeart = async (req, res) => {
    try {
        await Community.initializeTables();
        const commentId = Number(req.params.commentId);
        if (!commentId) {
            return res.status(400).json({ success: false, message: 'Invalid heart request.' });
        }

        const comment = await Community.getCommentById(commentId);
        if (!comment) {
            return res.status(404).json({ success: false, message: 'Comment not found.' });
        }

        const result = await Community.toggleCommentHeart(commentId, req.user.id);
        return res.json({
            success: true,
            message: result.hearted ? 'You hearted this comment.' : 'You removed your heart.',
            hearted: result.hearted,
            heartCount: result.heartCount
        });
    } catch (error) {
        console.error('Error toggling heart:', error);
        return res.status(500).json({ success: false, message: 'Could not update the heart right now.' });
    }
};

exports.reportComment = async (req, res) => {
    try {
        await Community.initializeTables();
        const commentId = Number(req.params.commentId);
        const reason = sanitizeText(req.body.reason, 255);

        if (!commentId || !reason) {
            return res.status(400).json({ success: false, message: 'Please provide a reason for this report.' });
        }

        const comment = await Community.getCommentById(commentId);
        if (!comment) {
            return res.status(404).json({ success: false, message: 'Comment not found.' });
        }

        await Community.reportComment({ commentId, userId: req.user.id, reason });

        await createAdminStaffNotifications({
            title: 'Community Comment Reported',
            message: 'A comment was reported and needs review.',
            link: '/admin/community-moderation'
        });

        return res.json({ success: true, message: 'Thanks for reporting. We will review this comment.' });
    } catch (error) {
        console.error('Error reporting comment:', error);
        return res.status(500).json({ success: false, message: 'Could not submit your report right now.' });
    }
};

exports.getReportedComments = async (req, res) => {
    try {
        await Community.initializeTables();
        const reports = await Community.getReportedComments();
        return res.json({ success: true, reports: reports.map(normalizeReportedComment) });
    } catch (error) {
        console.error('Error loading reports:', error);
        return res.status(500).json({ success: false, message: 'Could not load reported comments right now.' });
    }
};

exports.reviewCommentReport = async (req, res) => {
    try {
        await Community.initializeTables();
        const reportId = Number(req.params.reportId);
        const action = String(req.body.action || '').toLowerCase();
        if (!reportId || !['reviewed', 'dismissed'].includes(action)) {
            return res.status(400).json({ success: false, message: 'Invalid review request.' });
        }

        const updated = await Community.reviewCommentReport(reportId, req.user.id, action);
        if (!updated) {
            return res.status(404).json({ success: false, message: 'Report not found.' });
        }

        return res.json({ success: true, message: 'Report updated successfully.' });
    } catch (error) {
        console.error('Error reviewing report:', error);
        return res.status(500).json({ success: false, message: 'Could not update this report right now.' });
    }
};

exports.getUserProfile = async (req, res) => {
    try {
        await Community.initializeTables();
        const userId = Number(req.params.userId);
        if (!userId) {
            return res.status(400).json({ success: false, message: 'Invalid user request.' });
        }

        const profile = await Community.getUserProfileById(userId);
        if (!profile) {
            return res.status(404).json({ success: false, message: 'User profile not found.' });
        }

        return res.json({
            success: true,
            profile: {
                id: profile.id,
                firstName: profile.first_name,
                lastName: profile.last_name,
                username: profile.username,
                role: profile.role,
                profileImage: profile.profile_image,
                joinedAt: profile.created_at
            }
        });
    } catch (error) {
        console.error('Error getting user profile:', error);
        return res.status(500).json({ success: false, message: 'Could not load this profile right now.' });
    }
};
