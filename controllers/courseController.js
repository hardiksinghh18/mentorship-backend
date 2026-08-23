const sequelize = require('../config/db');
const Course = require('../models/Course');
const Module = require('../models/Module');
const CourseEnrollment = require('../models/CourseEnrollment');
const User = require('../models/User');

// Create a new Course and modules
exports.createCourse = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const {
      title,
      description,
      skillsTargeted,
      durationValue,
      durationUnit,
      maxStudents,
      modules,
    } = req.body;

    // Validations
    if (!title || typeof title !== 'string' || title.trim() === '') {
      return res.status(400).json({ message: 'Valid course title is required' });
    }
    if (!description || typeof description !== 'string' || description.trim() === '') {
      return res.status(400).json({ message: 'Valid description is required' });
    }
    if (!durationValue || isNaN(Number(durationValue)) || Number(durationValue) < 1) {
      return res.status(400).json({ message: 'Duration must be a positive number' });
    }
    if (!['Days', 'Weeks', 'Months'].includes(durationUnit)) {
      return res.status(400).json({ message: 'Valid duration unit (Days, Weeks, Months) is required' });
    }
    if (!maxStudents || isNaN(Number(maxStudents)) || Number(maxStudents) < 1) {
      return res.status(400).json({ message: 'Student capacity must be at least 1' });
    }
    if (!modules || !Array.isArray(modules) || modules.length === 0) {
      return res.status(400).json({ message: 'At least one module syllabus is required' });
    }

    // Process skillsTargeted (convert to array if string)
    let processedSkills = [];
    if (Array.isArray(skillsTargeted)) {
      processedSkills = skillsTargeted;
    } else if (typeof skillsTargeted === 'string') {
      processedSkills = skillsTargeted.split(',').map(s => s.trim()).filter(Boolean);
    }

    // Create course
    const course = await Course.create({
      title,
      description,
      skillsTargeted: processedSkills,
      durationValue: parseInt(durationValue, 10),
      durationUnit,
      maxStudents: parseInt(maxStudents, 10),
      creatorId: req.user.id,
    }, { transaction });

    // Auto-enroll the creator as an accepted student
    await CourseEnrollment.create({
      courseId: course.id,
      userId: req.user.id,
      status: 'accepted',
      completedModules: [],
    }, { transaction });

    // Create syllabus modules
    const modulePromises = modules.map((mod, index) => {
      if (!mod.title || typeof mod.title !== 'string' || mod.title.trim() === '') {
        throw new Error(`Module #${index + 1} requires a valid title`);
      }
      if (!mod.summary || typeof mod.summary !== 'string' || mod.summary.trim() === '') {
        throw new Error(`Module #${index + 1} requires a summary`);
      }

      return Module.create({
        courseId: course.id,
        orderIndex: index + 1,
        title: mod.title,
        summary: mod.summary,
        resources: mod.resources || [],
        meetingLink: mod.meetingLink || null,
        meetingTime: mod.meetingTime ? new Date(mod.meetingTime) : null,
      }, { transaction });
    });

    const createdModules = await Promise.all(modulePromises);

    await transaction.commit();
    res.status(201).json({
      message: 'Course and syllabus published successfully',
      course: {
        ...course.toJSON(),
        modules: createdModules,
      }
    });
  } catch (error) {
    await transaction.rollback();
    res.status(400).json({ message: error.message || 'Failed to create course' });
  }
};

// Fetch all courses
exports.getAllCourses = async (req, res, next) => {
  try {
    let requestUserId = null;
    const accessToken = req.cookies.accessToken;
    if (accessToken) {
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_KEY);
        const requestUser = await User.findOne({ where: { email: decoded.email } });
        if (requestUser) {
          requestUserId = requestUser.id;
        }
      } catch (err) {
        // Ignore invalid token to keep public fetch working
      }
    }

    const courses = await Course.findAll({
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'fullName', 'username', 'email'],
        }
      ],
      order: [['createdAt', 'DESC']],
    });

    const coursesWithCounts = await Promise.all(
      courses.map(async (course) => {
        const enrolledCount = await CourseEnrollment.count({
          where: { courseId: course.id, status: 'accepted' }
        });

        let userEnrollmentStatus = null;
        if (requestUserId) {
          const enrollment = await CourseEnrollment.findOne({
            where: { courseId: course.id, userId: requestUserId }
          });
          if (enrollment) {
            userEnrollmentStatus = enrollment.status;
          }
        }

        return {
          ...course.toJSON(),
          enrolled: enrolledCount,
          capacity: course.maxStudents,
          userEnrollmentStatus,
        };
      })
    );

    res.status(200).json(coursesWithCounts);
  } catch (error) {
    next(error);
  }
};

// Fetch a single course syllabus player details
exports.getCourseDetails = async (req, res, next) => {
  try {
    const { id } = req.params;

    const course = await Course.findByPk(id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'fullName', 'username', 'email'],
        },
        {
          model: Module,
          as: 'modules',
        }
      ],
      order: [[{ model: Module, as: 'modules' }, 'orderIndex', 'ASC']],
    });

    if (!course) {
      return res.status(404).json({ message: 'Course learning track not found' });
    }

    const enrolledCount = await CourseEnrollment.count({
      where: { courseId: id, status: 'accepted' }
    });

    // Optional enrollment context checking if request has user details
    let enrollmentStatus = null;
    let completedModules = [];

    // Peek cookies directly if token exists without hard-gating the route
    const accessToken = req.cookies.accessToken;
    if (accessToken) {
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_KEY);
        const requestUser = await User.findOne({ where: { email: decoded.email } });
        
        if (requestUser) {
          const enrollment = await CourseEnrollment.findOne({
            where: { courseId: id, userId: requestUser.id }
          });
          if (enrollment) {
            enrollmentStatus = enrollment.status;
            completedModules = enrollment.completedModules;
          }
        }
      } catch (tokenErr) {
        // Suppress invalid tokens to keep the general info view public
      }
    }

    res.status(200).json({
      course: {
        ...course.toJSON(),
        enrolled: enrolledCount,
        capacity: course.maxStudents,
      },
      enrollmentStatus,
      completedModules,
    });
  } catch (error) {
    next(error);
  }
};

// Student sends request to enroll/join course
exports.requestEnrollment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const course = await Course.findByPk(id);
    if (!course) {
      return res.status(404).json({ message: 'Course learning track not found' });
    }

    // Check if creator is requesting to join their own track
    if (course.creatorId === userId) {
      return res.status(400).json({ message: 'You are the lead creator of this track' });
    }

    // Check if already enrolled or requested
    const existingEnrollment = await CourseEnrollment.findOne({
      where: { courseId: id, userId }
    });

    if (existingEnrollment) {
      return res.status(400).json({
        message: `You have already requested to join this course (status: ${existingEnrollment.status})`,
      });
    }

    const enrollment = await CourseEnrollment.create({
      courseId: id,
      userId,
      status: 'pending',
      completedModules: [],
    });

    res.status(201).json({
      message: 'Join course request sent successfully',
      enrollment,
    });
  } catch (error) {
    next(error);
  }
};

// Creator approves or declines enrollment
exports.manageEnrollmentRequest = async (req, res, next) => {
  try {
    const { enrollmentId } = req.params;
    const { status } = req.body; // 'accepted' or 'declined'

    if (!['accepted', 'declined'].includes(status)) {
      return res.status(400).json({ message: 'Valid status change (accepted/declined) is required' });
    }

    const enrollment = await CourseEnrollment.findByPk(enrollmentId, {
      include: [{ model: Course, as: 'course' }],
    });

    if (!enrollment) {
      return res.status(404).json({ message: 'Enrollment record not found' });
    }

    // Check if requesting user is creator of this course
    if (enrollment.course.creatorId !== req.user.id) {
      return res.status(403).json({ message: 'Only the track creator can manage enrollments' });
    }

    enrollment.status = status;
    await enrollment.save();

    res.status(200).json({
      message: `Enrollment successfully ${status}`,
      enrollment,
    });
  } catch (error) {
    next(error);
  }
};

// Fetch pending enrollment requests for a course creator
exports.getEnrollmentRequests = async (req, res, next) => {
  try {
    const { id } = req.params; // courseId

    const course = await Course.findByPk(id);
    if (!course) {
      return res.status(404).json({ message: 'Course learning track not found' });
    }

    if (course.creatorId !== req.user.id) {
      return res.status(403).json({ message: 'Only track creators can view applications' });
    }

    const requests = await CourseEnrollment.findAll({
      where: { courseId: id, status: 'pending' },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'fullName', 'username', 'email', 'bio'],
        }
      ]
    });

    res.status(200).json(requests);
  } catch (error) {
    next(error);
  }
};

// Toggle a module completion index for student player progress
exports.toggleModuleCompletion = async (req, res, next) => {
  try {
    const { id } = req.params; // courseId
    const { orderIndex } = req.body;
    const userId = req.user.id;

    if (!orderIndex || isNaN(Number(orderIndex))) {
      return res.status(400).json({ message: 'Valid module index is required' });
    }

    const course = await Course.findByPk(id);
    if (!course) {
      return res.status(404).json({ message: 'Course learning track not found' });
    }

    let enrollment = await CourseEnrollment.findOne({
      where: { courseId: id, userId }
    });

    if (!enrollment) {
      if (course.creatorId === userId) {
        // Creator auto-enrollment fallback for existing courses
        enrollment = await CourseEnrollment.create({
          courseId: id,
          userId,
          status: 'accepted',
          completedModules: [],
        });
      } else {
        return res.status(403).json({ message: 'You must be an accepted enrolled student to track progress' });
      }
    } else if (enrollment.status !== 'accepted' && course.creatorId !== userId) {
      return res.status(403).json({ message: 'Your enrollment request is pending approval' });
    }

    let completedList = [...enrollment.completedModules];
    const moduleNum = parseInt(orderIndex, 10);

    if (completedList.includes(moduleNum)) {
      completedList = completedList.filter(num => num !== moduleNum);
    } else {
      completedList.push(moduleNum);
    }

    enrollment.completedModules = completedList;
    await enrollment.save();

    res.status(200).json({
      message: 'Module completion updated successfully',
      completedModules: enrollment.completedModules,
    });
  } catch (error) {
    next(error);
  }
};
