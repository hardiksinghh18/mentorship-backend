const express = require('express');
const courseController = require('../controllers/courseController');
const requireAuth = require('../middleware/requireAuth');
const router = express.Router();

// General public retrieval routes
router.get('/', courseController.getAllCourses);
router.get('/:id', courseController.getCourseDetails);

// Protected actions (requires valid cookie session)
router.post('/', requireAuth, courseController.createCourse);
router.post('/:id/join', requireAuth, courseController.requestEnrollment);
router.get('/:id/requests', requireAuth, courseController.getEnrollmentRequests);
router.put('/enrollments/:enrollmentId', requireAuth, courseController.manageEnrollmentRequest);
router.put('/:id/toggle-module', requireAuth, courseController.toggleModuleCompletion);

module.exports = router;
