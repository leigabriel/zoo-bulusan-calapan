const express = require('express');
const router = express.Router();
const communityController = require('../controllers/community-controller');
const { protect, authorize } = require('../middleware/auth');
const { handleCloudinaryImageUpload } = require('../middleware/cloudinary-upload');

router.use(protect);

router.get('/posts', communityController.getPublicPosts);
router.post('/posts', handleCloudinaryImageUpload('community', 'postImage'), communityController.createPost);
router.put('/posts/:postId', handleCloudinaryImageUpload('community', 'postImage'), communityController.updatePost);
router.delete('/posts/:postId', communityController.deletePost);

router.get('/posts/pending', authorize('admin', 'staff'), communityController.getPendingPosts);
router.patch('/posts/:postId/review', authorize('admin', 'staff'), communityController.reviewPost);

router.get('/posts/:postId/comments', communityController.getCommentsByPost);
router.post('/posts/:postId/comments', communityController.createComment);
router.put('/comments/:commentId', communityController.updateComment);
router.delete('/comments/:commentId', communityController.deleteComment);
router.post('/comments/:commentId/heart', communityController.toggleCommentHeart);
router.post('/comments/:commentId/report', communityController.reportComment);

router.get('/comments/reported', authorize('admin', 'staff'), communityController.getReportedComments);
router.patch('/reports/:reportId/review', authorize('admin', 'staff'), communityController.reviewCommentReport);

router.get('/users/:userId/profile', communityController.getUserProfile);

module.exports = router;
