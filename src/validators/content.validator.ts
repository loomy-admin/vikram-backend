import { z } from 'zod';
import { ContentType, ContentStatus, SubjectStatus, ChapterStatus, TopicStatus, ClassStatus } from '../types/enums';

export const createClassSchema = z.object({
  name: z.string().min(1, 'Class name is required (e.g. Nursery, LKG, Grade 1)'),
  grade: z.number().int('Grade must be an integer'),
  status: z.nativeEnum(ClassStatus).optional(),
});

export const createSubjectSchema = z.object({
  classId: z.number().int().positive('classId is required'),
  name: z.string().min(1, 'Subject name is required'),
  description: z.string().optional(),
  imageUrl: z.string().optional().nullable(),
  order: z.number().int().nonnegative().optional(),
  status: z.nativeEnum(SubjectStatus).optional(),
});

export const updateSubjectSchema = createSubjectSchema.partial();

export const createChapterSchema = z.object({
  subjectId: z.number().int().positive('subjectId is required'),
  name: z.string().min(1, 'Chapter name is required'),
  description: z.string().optional(),
  imageUrl: z.string().optional().nullable(),
  order: z.number().int().nonnegative().optional(),
  status: z.nativeEnum(ChapterStatus).optional(),
});

export const updateChapterSchema = createChapterSchema.partial();

export const createTopicSchema = z.object({
  chapterId: z.number().int().positive('chapterId is required'),
  name: z.string().min(1, 'Topic name is required'),
  description: z.string().optional(),
  imageUrl: z.string().optional().nullable(),
  order: z.number().int().nonnegative().optional(),
  status: z.nativeEnum(TopicStatus).optional(),
});

export const updateTopicSchema = createTopicSchema.partial();

export const createContentSchema = z.object({
  topicId: z.number().int().positive().optional(),
  chapterId: z.number().int().positive().optional(),
  title: z.string().min(1, 'Content title is required'),
  type: z.nativeEnum(ContentType, {
    errorMap: () => ({ message: 'Content type must be VIDEO, PDF, or WEB_LINK' }),
  }),
  url: z.string().min(1, 'Content URL or file path is required'),
  thumbnailUrl: z.string().optional().nullable(),
  description: z.string().optional(),
  order: z.number().int().nonnegative().optional(),
  status: z.nativeEnum(ContentStatus).optional(),
  metadata: z.record(z.any()).optional(),
}).refine(
  (data) => (data.topicId && !data.chapterId) || (!data.topicId && data.chapterId),
  {
    message: 'Content must belong to EITHER a topicId OR a chapterId (not both and not neither)',
    path: ['topicId'],
  }
);

export const updateContentSchema = z.object({
  topicId: z.number().int().positive().optional().nullable(),
  chapterId: z.number().int().positive().optional().nullable(),
  title: z.string().min(1).optional(),
  type: z.nativeEnum(ContentType).optional(),
  url: z.string().min(1).optional(),
  thumbnailUrl: z.string().optional().nullable(),
  description: z.string().optional(),
  order: z.number().int().nonnegative().optional(),
  status: z.nativeEnum(ContentStatus).optional(),
  metadata: z.record(z.any()).optional(),
}).refine(
  (data) => {
    // Only validate if both fields are present in the PATCH body
    const hasTopicId = data.topicId !== undefined && data.topicId !== null;
    const hasChapterId = data.chapterId !== undefined && data.chapterId !== null;
    if (hasTopicId && hasChapterId) return false; // Cannot set both simultaneously
    return true;
  },
  {
    message: 'Content cannot belong to both a topicId and a chapterId simultaneously',
    path: ['topicId'],
  }
);

export const updateContentVisibilitySchema = z.object({
  status: z.nativeEnum(ContentStatus, {
    errorMap: () => ({ message: 'Status must be VISIBLE or HIDDEN' }),
  }),
});
