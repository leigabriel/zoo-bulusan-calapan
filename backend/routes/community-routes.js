const express = require('express');
const router = express.Router();
const communityController = require('../controllers/community-controller');
const { protect, authorize, optionalAuth } = require('../middleware/auth');
const { handleCloudinaryImageUpload, handleCloudinaryMultiImageUpload } = require('../middleware/cloudinary-upload');

// Up to five photos per post. Images are sent one at a time to Cloudinary (its Upload API
// takes a single asset per request), which is why the client shows a running total.
const MAX_POST_IMAGES = 5;

// Guests may read the community, so auth is resolved optionally rather than enforced:
// optionalAuth fills req.user when a valid token is present and otherwise passes through, so
// the server-computed is_owner / liked_by_viewer / hearted_by_viewer flags still work for
// signed-in visitors. Every route that writes, and every staff-only route, carries `protect`
// itself — authorize() reads req.user.role directly and would throw without it.

router.use(optionalAuth);

// --- Public reads (no account required) ---
router.get('/posts', communityController.getPublicPosts);
router.get('/posts/:postId/comments', communityController.getCommentsByPost);
router.get('/users/:userId/profile', communityController.getUserProfile);

// --- Any signed-in user ---
router.post('/posts', protect, handleCloudinaryMultiImageUpload('community', 'postImages', MAX_POST_IMAGES, 'postImage'), communityController.createPost);
router.put('/posts/:postId', protect, handleCloudinaryImageUpload('community', 'postImage'), communityController.updatePost);
router.delete('/posts/:postId', protect, communityController.deletePost);
router.post('/posts/:postId/like', protect, communityController.togglePostLike);
router.post('/posts/:postId/report', protect, communityController.reportPost);
router.post('/posts/:postId/comments', protect, communityController.createComment);
router.put('/comments/:commentId', protect, communityController.updateComment);
router.delete('/comments/:commentId', protect, communityController.deleteComment);
router.post('/comments/:commentId/heart', protect, communityController.toggleCommentHeart);
router.post('/comments/:commentId/report', protect, communityController.reportComment);

// --- Admin / staff only ---
// /posts/reported sits with the other literal /posts/... paths so a future
// GET /posts/:postId cannot shadow it.
router.get('/posts/reported', protect, authorize('admin', 'staff'), communityController.getReportedPosts);
router.get('/posts/all', protect, authorize('admin', 'staff'), communityController.getAllPostsForModeration);
router.patch('/posts/:postId/remove', protect, authorize('admin', 'staff'), communityController.removeReportedPost);
router.patch('/post-reports/:reportId/review', protect, authorize('admin', 'staff'), communityController.reviewPostReport);
router.get('/comments/reported', protect, authorize('admin', 'staff'), communityController.getReportedComments);
router.patch('/reports/:reportId/review', protect, authorize('admin', 'staff'), communityController.reviewCommentReport);

module.exports = router;
