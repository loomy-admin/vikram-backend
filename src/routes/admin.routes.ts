import { Router } from 'express';
import * as AdminController from '../controllers/admin.controller';
import * as AccessCodeController from '../controllers/accessCode.controller';
import * as ContentController from '../controllers/content.controller';
import { adminAuthMiddleware } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validate.middleware';
import { upload } from '../middleware/upload.middleware';

import {
  createSchoolSchema,
  updateSchoolSchema,
  updateSchoolStatusSchema,
} from '../validators/school.validator';

import {
  createSingleAccessCodeSchema,
  createBulkAccessCodesSchema,
  updateAccessCodeStatusSchema,
  reassignAccessCodeSchema,
} from '../validators/accessCode.validator';

import {
  createAdminUserSchema,
  updateAdminUserSchema,
  updateAdminUserStatusSchema,
  updateStudentStatusSchema,
} from '../validators/admin.validator';

import {
  createClassSchema,
  createSubjectSchema,
  updateSubjectSchema,
  createChapterSchema,
  updateChapterSchema,
  createTopicSchema,
  updateTopicSchema,
  createContentSchema,
  updateContentSchema,
  updateContentVisibilitySchema,
} from '../validators/content.validator';

const router = Router();

// Protect ALL admin routes with adminAuthMiddleware
router.use(adminAuthMiddleware);

// --------------------------------------------------------
// 1. DASHBOARD STATS
// --------------------------------------------------------
router.get('/dashboard', AdminController.getDashboard);

// --------------------------------------------------------
// 2. SCHOOL MANAGEMENT
// --------------------------------------------------------
router.post('/schools', validateBody(createSchoolSchema), AdminController.createSchool);
router.get('/schools', AdminController.listSchools);
router.get('/schools/:id', AdminController.getSchoolById);
router.put('/schools/:id', validateBody(updateSchoolSchema), AdminController.updateSchool);
router.patch('/schools/:id/status', validateBody(updateSchoolStatusSchema), AdminController.updateSchoolStatus);
router.get('/schools/:id/students', AdminController.getSchoolStudents);
router.get('/schools/:id/access-codes', AdminController.getSchoolAccessCodes);

// --------------------------------------------------------
// 3. STUDENT MANAGEMENT
// --------------------------------------------------------
router.get('/students', AdminController.listStudents);
router.get('/students/:id', AdminController.getStudentById);
router.patch('/students/:id/status', validateBody(updateStudentStatusSchema), AdminController.updateStudentStatus);

// --------------------------------------------------------
// 4. ACCESS CODE MANAGEMENT
// --------------------------------------------------------
router.post('/access-codes', validateBody(createSingleAccessCodeSchema), AccessCodeController.generateSingleCode);
router.post('/access-codes/bulk', validateBody(createBulkAccessCodesSchema), AccessCodeController.generateBulkCodes);
router.patch('/access-codes/bulk-status', AccessCodeController.bulkUpdateAccessCodeStatus);
router.get('/access-codes', AccessCodeController.listAccessCodes);
router.get('/access-codes/:id', AccessCodeController.getAccessCodeById);
router.patch(
  '/access-codes/:id/status',
  validateBody(updateAccessCodeStatusSchema),
  AccessCodeController.updateAccessCodeStatus
);
router.put(
  '/access-codes/:id/reassign',
  validateBody(reassignAccessCodeSchema),
  AccessCodeController.reassignAccessCode
);

// --------------------------------------------------------
// 5. CLASS MANAGEMENT
// --------------------------------------------------------
router.get('/classes', ContentController.listClasses);
router.post('/classes', validateBody(createClassSchema), ContentController.createClass);
router.put('/classes/:id', ContentController.updateClass);
router.delete('/classes/:id', ContentController.deleteClass);

// --------------------------------------------------------
// 6. SUBJECT MANAGEMENT
// --------------------------------------------------------
router.post('/subjects', validateBody(createSubjectSchema), ContentController.createSubject);
router.get('/subjects', ContentController.listSubjects);
router.get('/subjects/:id', ContentController.getSubjectById);
router.put('/subjects/:id', validateBody(updateSubjectSchema), ContentController.updateSubject);
router.delete('/subjects/:id', ContentController.deleteSubject);

// --------------------------------------------------------
// 7. CHAPTER MANAGEMENT
// --------------------------------------------------------
router.post('/chapters', validateBody(createChapterSchema), ContentController.createChapter);
router.get('/chapters', ContentController.listChapters);
router.get('/chapters/:id', ContentController.getChapterById);
router.put('/chapters/:id', validateBody(updateChapterSchema), ContentController.updateChapter);
router.delete('/chapters/:id', ContentController.deleteChapter);

// --------------------------------------------------------
// 8. TOPIC MANAGEMENT
// --------------------------------------------------------
router.post('/topics', validateBody(createTopicSchema), ContentController.createTopic);
router.get('/topics', ContentController.listTopics);
router.get('/topics/:id', ContentController.getTopicById);
router.put('/topics/:id', validateBody(updateTopicSchema), ContentController.updateTopic);
router.delete('/topics/:id', ContentController.deleteTopic);

// --------------------------------------------------------
// 9. CONTENT MANAGEMENT
// --------------------------------------------------------
router.post('/content', validateBody(createContentSchema), ContentController.createContent);
router.get('/content', ContentController.listContent);
router.get('/content/:id', ContentController.getContentById);
router.put('/content/:id', validateBody(updateContentSchema), ContentController.updateContent);
router.patch(
  '/content/:id/visibility',
  validateBody(updateContentVisibilitySchema),
  ContentController.updateContentVisibility
);
router.delete('/content/:id', ContentController.deleteContent);
router.post('/content/upload', upload.single('file'), ContentController.uploadFile);
router.post('/upload/image', upload.single('file'), ContentController.uploadImage);

// --------------------------------------------------------
// 10. ADMIN USER MANAGEMENT
// --------------------------------------------------------
router.post('/users', validateBody(createAdminUserSchema), AdminController.createAdminUser);
router.get('/users', AdminController.listAdminUsers);
router.get('/users/:id', AdminController.getAdminUserById);
router.put('/users/:id', validateBody(updateAdminUserSchema), AdminController.updateAdminUser);
router.patch(
  '/users/:id/status',
  validateBody(updateAdminUserStatusSchema),
  AdminController.updateAdminUserStatus
);

export default router;
