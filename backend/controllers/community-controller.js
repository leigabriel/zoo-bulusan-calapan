const Community = require('../models/community-model');
const { notifyManagement, notifyUser } = require('../services/notification-service');
const { deleteFromCloudinary, extractPublicId } = require('../middleware/cloudinary-upload');
const { logUserActivity, logStaffActivity } = require('../middleware/track-activity');
const { validatePostReport } = require('../utils/post-report-rules');

/**
 * Normalise a user-supplied plain-text field: collapse runs of whitespace and
 * cap the length.
 *
 * This is NOT HTML sanitisation and must never be treated as a security
 * control. Post, comment, report and note content is stored and returned as
 * plain text; the database is allowed to hold markup because no consumer
 * interprets this field as HTML. Escaping is the responsibility of whatever
 * renders the value (React's JSX auto-escapes it today).
 *
 * The name is deliberate: an earlier helper called `sanitizeText` implied it
 * removed markup when it did not, which invites developers to skip escaping.
 * See tests/community-content-safety.test.js, which fails if an HTML sink is
 * ever introduced on this content.
 *
 * @param {unknown} value Untrusted input
 * @param {number} maxLength Maximum characters to keep
 * @returns {string}
 */
const normalizePlainText = (value, maxLength = 2000) => {
  if (typeof value !== 'string') return '';
  return value.replace(/\s+/g, ' ').trim().slice(0, maxLength);
};

const normalizePost = (post) => ({
  id: post.id,
  userId: post.user_id,
  content: post.content,
  imageUrl: post.image_url,
  images: Array.isArray(post.images) ? post.images : (post.image_url ? [post.image_url] : []),
  status: post.status,
  moderationNote: post.moderation_note || null,
  // Computed server-side: the client cannot compare user ids because they arrive as
  // pid_ ciphertexts, and a fresh random IV makes two of them differ.
  isOwner: Boolean(post.is_owner),
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
  // Server-side, for the same reason as posts: the client cannot compare user ids.
  isOwner: Boolean(comment.is_owner),
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

const normalizeReportedPost = (report) => ({
  reportId: report.report_id,
  postId: report.post_id,
  reason: report.reason,
  reasonDetail: report.reason_detail || null,
  status: report.status,
  reportedAt: report.reported_at,
  reportedBy: report.reported_by,
  content: report.content,
  imageUrl: report.image_url,
  images: Array.isArray(report.images) ? report.images : (report.image_url ? [report.image_url] : []),
  postStatus: report.post_status,
  moderationNote: report.moderation_note || null,
  postCreatedAt: report.post_created_at,
  postUserId: report.post_user_id,
  author: {
    firstName: report.author_first_name,
    lastName: report.author_last_name,
    username: report.author_username,
    profileImage: report.author_profile_image
  },
  reporter: {
    firstName: report.reporter_first_name,
    lastName: report.reporter_last_name,
    username: report.reporter_username
  }
});

const createAdminStaffNotifications = async ({ title, message, type = 'community', link = '/admin/community-moderation' }) => {
  await notifyManagement({ title, message, type, link });
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
    const content = normalizePlainText(req.body.content, 3000);

    if (!content) {
      return res.status(400).json({ success: false, message: 'Please write something before posting.' });
    }

    const uploads = req.cloudinaryResults || [];
    const imageUrl = uploads[0]?.secure_url || req.cloudinaryResult?.secure_url || null;
    const imagePublicId = uploads[0]?.public_id || req.cloudinaryResult?.public_id || null;

    const postId = await Community.createPost({
      userId: req.user.id,
      content,
      imageUrl,
      imagePublicId
    });

    if (uploads.length) {
      await Community.addPostImages(postId, uploads);
    }

    if (req.user.role === 'user') {
      await logUserActivity(req, 'post_create', 'Created a community post', 'community', postId);
    }

    // Confirm the post reached the feed in the notification panel, not just as a toast. The
    // client uploads asynchronously and may be on another page by the time this resolves, so
    // the panel entry is the durable record that it succeeded.
    try {
      await notifyUser(
        req.user.id,
        'post.published',
        { photos: uploads.length },
        '/community'
      );
    } catch (error) {
      // The post is already saved. A notification fault must not turn a successful publish
      // into a failed request the visitor then retries and duplicates.
      console.error('Error creating post.published notification:', error);
    }

    return res.status(201).json({
      success: true,
      message: req.uploadWarnings?.length
        ? `Your post is live, but ${req.uploadWarnings.length} photo(s) could not be uploaded.`
        : 'Your post is live.',
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

    const content = normalizePlainText(req.body.content, 3000);
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

    // Keep the gallery in step with the cover. Rows left over from when a post could carry
    // several photos would otherwise keep rendering in the carousel after an edit.
    if (req.cloudinaryResult) {
      await Community.replacePostImages(postId, [req.cloudinaryResult]);
    } else if (removeImage) {
      await Community.replacePostImages(postId, []);
    }

    if (req.user.role === 'user') {
      await logUserActivity(req, 'post_update', 'Updated a community post', 'community', postId);
    }

    return res.json({
      success: true,
      message: 'Post updated.'
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

    // Reclaim every image this post owns from Cloudinary, not just the cover. Gallery rows
    // cascade away with the post row, so the only lasting trace is the remote asset - left
    // behind it stays in the bucket forever and silently eats the storage quota. A cleanup
    // failure is logged but never blocks the delete: the row is gone either way, and a
    // stranded asset is a smaller problem than a post the user cannot remove.
    const ownedImages = await Community.getPostImagePublicIds(postId);
    const cleaned = new Set();
    for (const image of ownedImages) {
      const publicId = image.image_public_id || extractPublicId(image.image_url);
      if (!publicId || cleaned.has(publicId)) continue;
      cleaned.add(publicId);
      try {
        await deleteFromCloudinary(publicId);
      } catch (cloudError) {
        console.error(`Cloudinary cleanup failed for post ${postId} asset ${publicId}:`, cloudError.message);
      }
    }

    const deleted = isModerator
      ? await Community.deletePostById(postId)
      : await Community.deletePostByOwner(postId, req.user.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Post not found.' });
    }

    if (isModerator) {
      await logStaffActivity(req, 'post_delete', 'Deleted community post', 'community_post', postId);
    } else if (req.user.role === 'user') {
      await logUserActivity(req, 'post_delete', 'Deleted a community post', 'community', postId);
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

// Shared by the "uphold a report" and "remove from All posts" paths so the two cannot
// drift: both hide the post, close any reports against it, and tell the author why.
const removePostAsModerator = async (req, post, note) => {
  await Community.removePostByModerator(post.id, req.user.id, note);
  await Community.closePostReports(post.id, req.user.id, 'reviewed');

  try {
    await notifyUser(post.user_id, 'post.moderated', { note }, '/community');
  } catch (error) {
    console.error('Error notifying post owner after removal:', error);
  }
};

exports.reviewPostReport = async (req, res) => {
  try {
    await Community.initializeTables();
    const reportId = Number(req.params.reportId);
    const action = String(req.body.action || '').toLowerCase();
    const note = normalizePlainText(req.body.note || '', 255);

    if (!reportId || !['reviewed', 'dismissed'].includes(action)) {
      return res.status(400).json({ success: false, message: 'Invalid review request.' });
    }

    if (action === 'reviewed' && !note) {
      return res.status(400).json({ success: false, message: 'Please provide a reason for removing this post.' });
    }

    const report = await Community.reviewPostReport(reportId, req.user.id, action);
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found.' });
    }

    // Upholding the report removes the post and clears every other report on it, so the
    // queue cannot be left holding an entry for a post that has already been removed.
    if (action === 'reviewed') {
      const post = await Community.getPostByIdWithAuthor(report.postId);
      if (post) {
        await removePostAsModerator(req, post, note);
      }
    }

    await logStaffActivity(req, 'post_report_review', `${action === 'reviewed' ? 'Upheld' : 'Dismissed'} a community post report`, 'community_post', report.postId);

    return res.json({
      success: true,
      message: action === 'reviewed' ? 'Post removed.' : 'Report dismissed.'
    });
  } catch (error) {
    console.error('Error reviewing post report:', error);
    return res.status(500).json({ success: false, message: 'Could not update this report right now.' });
  }
};

exports.removeReportedPost = async (req, res) => {
  try {
    await Community.initializeTables();
    const postId = Number(req.params.postId);
    const note = normalizePlainText(req.body.note || '', 255);

    if (!postId) {
      return res.status(400).json({ success: false, message: 'Invalid post request.' });
    }
    if (!note) {
      return res.status(400).json({ success: false, message: 'Please provide a reason for removing this post.' });
    }

    const post = await Community.getPostByIdWithAuthor(postId);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found.' });
    }

    await removePostAsModerator(req, post, note);

    await logStaffActivity(req, 'post_remove', 'Removed community post', 'community_post', postId);

    return res.json({ success: true, message: 'Post removed.' });
  } catch (error) {
    console.error('Error removing community post:', error);
    return res.status(500).json({ success: false, message: 'Could not remove this post right now.' });
  }
};

exports.reportPost = async (req, res) => {
  try {
    await Community.initializeTables();
    const postId = Number(req.params.postId);
    const validation = validatePostReport({ reason: req.body.reason, detail: req.body.detail });

    if (!validation.ok) {
      return res.status(400).json({ success: false, message: validation.error });
    }

    const post = await Community.getPostById(postId);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found.' });
    }

    // A post a moderator already removed has nothing left to review, so a stale tab
    // cannot push it back into the queue.
    if (post.status === 'declined') {
      return res.status(404).json({ success: false, message: 'This post is no longer available.' });
    }

    if (post.user_id === req.user.id) {
      return res.status(400).json({ success: false, message: 'You cannot report your own post.' });
    }

    await Community.reportPost({
      postId,
      userId: req.user.id,
      reason: validation.reason,
      reasonDetail: validation.detail
    });

    await createAdminStaffNotifications({
      title: 'Community Post Reported',
      message: 'A post was reported and needs review.'
    });

    if (req.user.role === 'user') {
      await logUserActivity(req, 'post_report', 'Reported a community post', 'community', postId);
    }

    return res.json({ success: true, message: 'Thanks for reporting. We will review this post.' });
  } catch (error) {
    console.error('Error reporting post:', error);
    return res.status(500).json({ success: false, message: 'Could not submit your report right now.' });
  }
};

exports.getReportedPosts = async (req, res) => {
  try {
    await Community.initializeTables();
    const reports = await Community.getReportedPosts();
    return res.json({ success: true, reports: reports.map(normalizeReportedPost) });
  } catch (error) {
    console.error('Error loading reported posts:', error);
    return res.status(500).json({ success: false, message: 'Could not load reported posts right now.' });
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
    const commentText = normalizePlainText(req.body.commentText, 1200);
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
        await notifyUser(
          postWithAuthor.user_id,
          'message.replied',
          { subject: `${req.user.firstName || req.user.username || 'A user'} commented on your post.` },
          '/community'
        );
      } catch (error) {
        console.error('Error creating user comment notification:', error);
      }
    }

    if (req.user.role === 'user') {
      await logUserActivity(req, 'comment_create', 'Created a comment', 'comment', commentId);
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
    if (req.user.role === 'user') {
      await logUserActivity(
        req,
        'post_like',
        result.liked ? 'Liked a post' : 'Unliked a post',
        'community',
        postId
      );
    }
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
    const commentText = normalizePlainText(req.body.commentText, 1200);

    if (!commentId || !commentText) {
      return res.status(400).json({ success: false, message: 'Please write a comment before updating.' });
    }

    const updated = await Community.updateCommentByOwner(commentId, req.user.id, commentText);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Comment not found or access denied.' });
    }

    if (req.user.role === 'user') {
      await logUserActivity(req, 'comment_update', 'Updated a community comment', 'comment', commentId);
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

    if (isModerator) {
      await logStaffActivity(req, 'comment_delete', 'Deleted community comment', 'comment', commentId);
    } else if (req.user.role === 'user') {
      await logUserActivity(req, 'comment_delete', 'Deleted a community comment', 'comment', commentId);
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
    if (req.user.role === 'user') {
      await logUserActivity(
        req,
        'comment_heart',
        result.hearted ? 'Hearted a comment' : 'Removed heart from a comment',
        'comment',
        commentId
      );
    }
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
    const reason = normalizePlainText(req.body.reason, 255);

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

    if (req.user.role === 'user') {
      await logUserActivity(req, 'comment_report', 'Reported a comment', 'comment', commentId);
    }

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

    await logStaffActivity(req, 'comment_report_review', `${action === 'reviewed' ? 'Reviewed' : 'Dismissed'} community report`, 'comment_report', reportId);

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
