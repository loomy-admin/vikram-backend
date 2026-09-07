import { Request, Response, NextFunction } from 'express';
import * as ContentService from '../services/content.service';
import * as StorageService from '../services/storage.service';
import * as CloudinaryService from '../services/cloudinary.service';
import { sendSuccess, sendCreated } from '../utils/response';
import { ContentType, ContentStatus, SubjectStatus, ChapterStatus, TopicStatus, ClassStatus } from '../types/enums';


  // ----------------------------------------------------
  // CLASS CONTROLLERS
  // ----------------------------------------------------
  export async function listClasses(req: Request, res: Response, next: NextFunction) {
    try {
      const status = req.query.status as ClassStatus;
      const result = await ContentService.listClasses({ status });
      return sendSuccess(res, result, 'Classes retrieved');
    } catch (error) {
      next(error);
    }
  }

  export async function createClass(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await ContentService.createClass(req.body);
      return sendCreated(res, result, 'Class created successfully');
    } catch (error) {
      next(error);
    }
  }

  export async function updateClass(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);
      const result = await ContentService.updateClass(id, req.body);
      return sendSuccess(res, result, 'Class updated successfully');
    } catch (error) {
      next(error);
    }
  }

  export async function deleteClass(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);
      await ContentService.deleteClass(id);
      return sendSuccess(res, null, 'Class deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  // ----------------------------------------------------
  // SUBJECT CONTROLLERS
  // ----------------------------------------------------
  export async function listSubjects(req: Request, res: Response, next: NextFunction) {
    try {
      const classId = req.query.classId ? parseInt(req.query.classId as string, 10) : undefined;
      const status = req.query.status as SubjectStatus;
      const result = await ContentService.listSubjects({ classId, status });
      return sendSuccess(res, result, 'Subjects retrieved');
    } catch (error) {
      next(error);
    }
  }

  export async function getSubjectById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);
      const result = await ContentService.getSubjectById(id);
      return sendSuccess(res, result, 'Subject retrieved');
    } catch (error) {
      next(error);
    }
  }

  export async function createSubject(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await ContentService.createSubject(req.body);
      return sendCreated(res, result, 'Subject created successfully');
    } catch (error) {
      next(error);
    }
  }

  export async function updateSubject(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);
      const result = await ContentService.updateSubject(id, req.body);
      return sendSuccess(res, result, 'Subject updated successfully');
    } catch (error) {
      next(error);
    }
  }

  export async function deleteSubject(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);
      await ContentService.deleteSubject(id);
      return sendSuccess(res, null, 'Subject deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  // ----------------------------------------------------
  // CHAPTER CONTROLLERS
  // ----------------------------------------------------
  export async function listChapters(req: Request, res: Response, next: NextFunction) {
    try {
      const subjectId = req.query.subjectId ? parseInt(req.query.subjectId as string, 10) : undefined;
      const status = req.query.status as ChapterStatus;
      const result = await ContentService.listChapters({ subjectId, status });
      return sendSuccess(res, result, 'Chapters retrieved');
    } catch (error) {
      next(error);
    }
  }

  export async function getChapterById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);
      const result = await ContentService.getChapterById(id);
      return sendSuccess(res, result, 'Chapter retrieved');
    } catch (error) {
      next(error);
    }
  }

  export async function createChapter(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await ContentService.createChapter(req.body);
      return sendCreated(res, result, 'Chapter created successfully');
    } catch (error) {
      next(error);
    }
  }

  export async function updateChapter(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);
      const result = await ContentService.updateChapter(id, req.body);
      return sendSuccess(res, result, 'Chapter updated successfully');
    } catch (error) {
      next(error);
    }
  }

  export async function deleteChapter(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);
      await ContentService.deleteChapter(id);
      return sendSuccess(res, null, 'Chapter deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  // ----------------------------------------------------
  // TOPIC CONTROLLERS
  // ----------------------------------------------------
  export async function listTopics(req: Request, res: Response, next: NextFunction) {
    try {
      const chapterId = req.query.chapterId ? parseInt(req.query.chapterId as string, 10) : undefined;
      const status = req.query.status as TopicStatus;
      const result = await ContentService.listTopics({ chapterId, status });
      return sendSuccess(res, result, 'Topics retrieved');
    } catch (error) {
      next(error);
    }
  }

  export async function getTopicById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);
      const result = await ContentService.getTopicById(id);
      return sendSuccess(res, result, 'Topic retrieved');
    } catch (error) {
      next(error);
    }
  }

  export async function createTopic(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await ContentService.createTopic(req.body);
      return sendCreated(res, result, 'Topic created successfully');
    } catch (error) {
      next(error);
    }
  }

  export async function updateTopic(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);
      const result = await ContentService.updateTopic(id, req.body);
      return sendSuccess(res, result, 'Topic updated successfully');
    } catch (error) {
      next(error);
    }
  }

  export async function deleteTopic(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);
      await ContentService.deleteTopic(id);
      return sendSuccess(res, null, 'Topic deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  // ----------------------------------------------------
  // CONTENT CONTROLLERS
  // ----------------------------------------------------
  export async function listContent(req: Request, res: Response, next: NextFunction) {
    try {
      const topicId = req.query.topicId ? parseInt(req.query.topicId as string, 10) : undefined;
      const chapterId = req.query.chapterId ? parseInt(req.query.chapterId as string, 10) : undefined;
      const type = req.query.type as ContentType;
      const status = req.query.status as ContentStatus;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;

      const result = await ContentService.listContent({ topicId, chapterId, type, status, page, limit });
      return sendSuccess(res, result, 'Content items retrieved');
    } catch (error) {
      next(error);
    }
  }

  export async function getContentById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);
      const result = await ContentService.getContentById(id);
      return sendSuccess(res, result, 'Content item retrieved');
    } catch (error) {
      next(error);
    }
  }

  export async function createContent(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await ContentService.createContent(req.body);
      return sendCreated(res, result, 'Content item registered successfully');
    } catch (error) {
      next(error);
    }
  }

  export async function updateContent(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);
      const result = await ContentService.updateContent(id, req.body);
      return sendSuccess(res, result, 'Content item updated successfully');
    } catch (error) {
      next(error);
    }
  }

  export async function updateContentVisibility(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);
      const result = await ContentService.updateContentVisibility(id, req.body.status);
      return sendSuccess(res, result, 'Content visibility updated successfully');
    } catch (error) {
      next(error);
    }
  }

  export async function deleteContent(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);
      await ContentService.deleteContent(id);
      return sendSuccess(res, null, 'Content item deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/admin/content/upload
   * Uploads file to StorageService and returns public URL & file metadata.
   */
  export async function uploadFile(req: Request, res: Response, next: NextFunction) {
    try {
      const file = (req as any).file;
      if (!file) {
        return res.status(400).json({ success: false, message: 'No file was uploaded' });
      }

      const fileUrl = StorageService.getPublicUrl(file.filename);

      return sendCreated(
        res,
        {
          filename: file.filename,
          originalName: file.originalname,
          mimeType: file.mimetype,
          sizeBytes: file.size,
          url: fileUrl,
        },
        'File uploaded successfully to storage'
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/admin/upload/image
   * Uploads image to Cloudinary (or fallback storage) and returns public secure URL.
   */
  export async function uploadImage(req: Request, res: Response, next: NextFunction) {
    try {
      const file = (req as any).file;
      if (!file) {
        return res.status(400).json({ success: false, message: 'No image file was uploaded' });
      }

      const filePath = file.path || file.filename;
      const result = await CloudinaryService.uploadImageToCloudinary(
        filePath,
        'student_learning_platform/subjects'
      );

      return sendCreated(
        res,
        {
          url: result.url,
          publicId: result.publicId,
          filename: file.filename,
          originalName: file.originalname,
          sizeBytes: file.size,
        },
        'Image uploaded successfully'
      );
    } catch (error) {
      next(error);
    }
  }


