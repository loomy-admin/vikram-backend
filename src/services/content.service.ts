import { ClassStatus, SubjectStatus, ChapterStatus, TopicStatus, ContentType, ContentStatus } from '../types/enums';
import { Class, Subject, Chapter, Topic, Content } from '../models';
import { Op } from 'sequelize';
import { ERROR_CODES, DEFAULT_PAGE_SIZE } from '../constants';
import { PaginatedResult } from '../types';

// ----------------------------------------------------
// CLASS MANAGEMENT
// ----------------------------------------------------
export async function listClasses(params?: { status?: ClassStatus }) {
  const where: any = {};
  if (params?.status) where.status = params.status;
  
  const classes = await Class.findAll({
    where,
    order: [['grade', 'ASC']],
    include: ['students', 'subjects'],
  });

  return classes.map((c: any) => ({
    ...c.toJSON(),
    _count: {
      students: c.students?.length || 0,
      subjects: c.subjects?.length || 0,
    },
  }));
}

export async function createClass(data: { name: string; grade: number; status?: ClassStatus }) {
  // Duplicate check: same name (case-insensitive) globally
  const existing = await Class.findOne({
    where: { name: data.name.trim() },
  });
  if (existing) {
    throw {
      statusCode: 409,
      code: ERROR_CODES.CLASS_ALREADY_EXISTS,
      message: `A class named "${data.name.trim()}" already exists. Please use a different name.`,
    };
  }

  return Class.create({
    name: data.name.trim(),
    grade: data.grade,
    status: data.status || ClassStatus.ACTIVE,
  });
}

export async function updateClass(id: number, data: { name?: string; grade?: number; status?: ClassStatus }) {
  const classRecord = await Class.findByPk(id);
  if (!classRecord) throw new Error('Class not found');

  // Duplicate check on rename
  if (data.name) {
    const existing = await Class.findOne({
      where: { name: data.name.trim(), id: { [Op.ne]: id } },
    });
    if (existing) {
      throw {
        statusCode: 409,
        code: ERROR_CODES.CLASS_ALREADY_EXISTS,
        message: `A class named "${data.name.trim()}" already exists. Please use a different name.`,
      };
    }
  }

  return classRecord.update(data);
}

export async function deleteClass(id: number) {
  const classRecord = await Class.findByPk(id);
  if (!classRecord) throw new Error('Class not found');
  return classRecord.destroy();
}

// ----------------------------------------------------
// SUBJECT MANAGEMENT
// ----------------------------------------------------
export async function listSubjects(params?: { classId?: number; status?: SubjectStatus }) {
  const where: any = {};
  if (params?.classId) where.classId = params.classId;
  if (params?.status) where.status = params.status;

  const subjects = await Subject.findAll({
    where,
    order: [['order', 'ASC'], ['id', 'ASC']],
    include: [
      { model: Class, as: 'class', attributes: ['id', 'name', 'grade'] },
      { model: Chapter, as: 'chapters', attributes: ['id'] },
    ],
  });

  return subjects.map((sub: any) => ({
    ...sub.toJSON(),
    _count: {
      chapters: sub.chapters?.length || 0,
    },
  }));
}

export async function getSubjectById(id: number) {
  const subject = await Subject.findByPk(id, {
    include: [
      { model: Class, as: 'class' },
      {
        model: Chapter,
        as: 'chapters',
        include: [{ model: Topic, as: 'topics', attributes: ['id'] }],
      },
    ],
    order: [[{ model: Chapter, as: 'chapters' }, 'order', 'ASC']],
  });

  if (!subject) {
    throw {
      statusCode: 404,
      code: ERROR_CODES.SUBJECT_NOT_FOUND,
      message: 'Subject not found',
    };
  }

  return {
    ...subject.toJSON(),
    chapters: (subject as any).chapters.map((chap: any) => ({
      ...chap,
      _count: { topics: chap.topics?.length || 0 },
    })),
  };
}

export async function createSubject(data: {
  classId: number;
  name: string;
  description?: string;
  imageUrl?: string | null;
  order?: number;
  status?: SubjectStatus;
}) {
  const classRecord = await Class.findByPk(data.classId);
  if (!classRecord) {
    throw { statusCode: 404, code: ERROR_CODES.CLASS_NOT_FOUND, message: 'Class not found' };
  }

  // Duplicate check: same name (case-insensitive) within the same class
  const existing = await Subject.findOne({
    where: {
      classId: data.classId,
      name: { [Op.like]: data.name.trim() },
    },
  });
  if (existing) {
    throw {
      statusCode: 409,
      code: ERROR_CODES.SUBJECT_ALREADY_EXISTS,
      message: `A subject named "${data.name.trim()}" already exists in this class. Please use a different name.`,
    };
  }

  return Subject.create({
    classId: data.classId,
    name: data.name.trim(),
    description: data.description,
    imageUrl: data.imageUrl || null,
    order: data.order ?? 0,
    status: data.status || SubjectStatus.ACTIVE,
  });
}

export async function updateSubject(
  id: number,
  data: { name?: string; description?: string; imageUrl?: string | null; order?: number; status?: SubjectStatus }
) {
  const subject = await Subject.findByPk(id);
  if (!subject) throw new Error('Subject not found');

  // Duplicate check on rename (within the same class)
  if (data.name) {
    const existing = await Subject.findOne({
      where: {
        classId: (subject as any).classId,
        name: { [Op.like]: data.name.trim() },
        id: { [Op.ne]: id },
      },
    });
    if (existing) {
      throw {
        statusCode: 409,
        code: ERROR_CODES.SUBJECT_ALREADY_EXISTS,
        message: `A subject named "${data.name.trim()}" already exists in this class. Please use a different name.`,
      };
    }
  }

  return subject.update(data);
}

export async function deleteSubject(id: number) {
  const subject = await Subject.findByPk(id);
  if (subject) await subject.destroy();
  return subject;
}

// ----------------------------------------------------
// CHAPTER MANAGEMENT
// ----------------------------------------------------
export async function listChapters(params?: { subjectId?: number; status?: ChapterStatus }) {
  const where: any = {};
  if (params?.subjectId) where.subjectId = params.subjectId;
  if (params?.status) where.status = params.status;

  const chapters = await Chapter.findAll({
    where,
    order: [['order', 'ASC'], ['id', 'ASC']],
    include: [
      { model: Subject, as: 'subject', attributes: ['id', 'name', 'classId'] },
      { model: Topic, as: 'topics', attributes: ['id'] },
      { model: Content, as: 'contents', attributes: ['id'] },
    ],
  });

  return chapters.map((chap: any) => ({
    ...chap.toJSON(),
    _count: {
      topics: chap.topics?.length || 0,
      contents: chap.contents?.length || 0,
    },
  }));
}

export async function getChapterById(id: number) {
  const chapter = await Chapter.findByPk(id, {
    include: [
      { model: Subject, as: 'subject', include: ['class'] },
      {
        model: Topic,
        as: 'topics',
        include: [{ model: Content, as: 'contents', attributes: ['id'] }],
      },
      {
        model: Content,
        as: 'contents',
      },
    ],
    order: [
      [{ model: Topic, as: 'topics' }, 'order', 'ASC'],
      [{ model: Content, as: 'contents' }, 'order', 'ASC'],
    ],
  });

  if (!chapter) {
    throw {
      statusCode: 404,
      code: ERROR_CODES.CHAPTER_NOT_FOUND,
      message: 'Chapter not found',
    };
  }

  return {
    ...chapter.toJSON(),
    _count: {
      topics: (chapter as any).topics?.length || 0,
      contents: (chapter as any).contents?.length || 0,
    },
    topics: (chapter as any).topics.map((top: any) => ({
      ...top.toJSON ? top.toJSON() : top,
      _count: { contents: top.contents?.length || 0 },
    })),
  };
}

export async function createChapter(data: {
  subjectId: number;
  name: string;
  description?: string;
  imageUrl?: string | null;
  order?: number;
  status?: ChapterStatus;
}) {
  const subject = await Subject.findByPk(data.subjectId);
  if (!subject) {
    throw { statusCode: 404, code: ERROR_CODES.SUBJECT_NOT_FOUND, message: 'Subject not found' };
  }

  // Duplicate check: same name (case-insensitive) within the same subject
  const existing = await Chapter.findOne({
    where: {
      subjectId: data.subjectId,
      name: { [Op.like]: data.name.trim() },
    },
  });
  if (existing) {
    throw {
      statusCode: 409,
      code: ERROR_CODES.CHAPTER_ALREADY_EXISTS,
      message: `A chapter named "${data.name.trim()}" already exists in this subject. Please use a different name.`,
    };
  }

  return Chapter.create({
    subjectId: data.subjectId,
    name: data.name.trim(),
    description: data.description,
    imageUrl: data.imageUrl || null,
    order: data.order ?? 0,
    status: data.status || ChapterStatus.ACTIVE,
  });
}

export async function updateChapter(
  id: number,
  data: { name?: string; description?: string; imageUrl?: string | null; order?: number; status?: ChapterStatus }
) {
  const chapter = await Chapter.findByPk(id);
  if (!chapter) throw new Error('Chapter not found');

  // Duplicate check on rename (within the same subject)
  if (data.name) {
    const existing = await Chapter.findOne({
      where: {
        subjectId: (chapter as any).subjectId,
        name: { [Op.like]: data.name.trim() },
        id: { [Op.ne]: id },
      },
    });
    if (existing) {
      throw {
        statusCode: 409,
        code: ERROR_CODES.CHAPTER_ALREADY_EXISTS,
        message: `A chapter named "${data.name.trim()}" already exists in this subject. Please use a different name.`,
      };
    }
  }

  return chapter.update(data);
}

export async function deleteChapter(id: number) {
  const chapter = await Chapter.findByPk(id);
  if (chapter) await chapter.destroy();
  return chapter;
}

// ----------------------------------------------------
// TOPIC MANAGEMENT
// ----------------------------------------------------
export async function listTopics(params?: { chapterId?: number; status?: TopicStatus }) {
  const where: any = {};
  if (params?.chapterId) where.chapterId = params.chapterId;
  if (params?.status) where.status = params.status;

  const topics = await Topic.findAll({
    where,
    order: [['order', 'ASC']],
    include: [
      { model: Chapter, as: 'chapter', include: ['subject'] },
      { model: Content, as: 'contents', attributes: ['id'] },
    ],
  });

  return topics.map((top: any) => ({
    ...top.toJSON(),
    _count: { contents: top.contents?.length || 0 },
  }));
}

export async function getTopicById(id: number) {
  const topic = await Topic.findByPk(id, {
    include: [
      {
        model: Chapter,
        as: 'chapter',
        include: [{ model: Subject, as: 'subject', include: ['class'] }],
      },
      { model: Content, as: 'contents' },
    ],
    order: [[{ model: Content, as: 'contents' }, 'order', 'ASC']],
  });

  if (!topic) {
    throw {
      statusCode: 404,
      code: ERROR_CODES.TOPIC_NOT_FOUND,
      message: 'Topic not found',
    };
  }

  return topic;
}

export async function createTopic(data: {
  chapterId: number;
  name: string;
  description?: string;
  imageUrl?: string | null;
  order?: number;
  status?: TopicStatus;
}) {
  const chapter = await Chapter.findByPk(data.chapterId);
  if (!chapter) {
    throw { statusCode: 404, code: ERROR_CODES.CHAPTER_NOT_FOUND, message: 'Chapter not found' };
  }

  // Duplicate check: same name (case-insensitive) within the same chapter
  const existing = await Topic.findOne({
    where: {
      chapterId: data.chapterId,
      name: { [Op.like]: data.name.trim() },
    },
  });
  if (existing) {
    throw {
      statusCode: 409,
      code: ERROR_CODES.TOPIC_ALREADY_EXISTS,
      message: `A topic named "${data.name.trim()}" already exists in this chapter. Please use a different name.`,
    };
  }

  return Topic.create({
    chapterId: data.chapterId,
    name: data.name.trim(),
    description: data.description,
    imageUrl: data.imageUrl || null,
    order: data.order ?? 0,
    status: data.status || TopicStatus.ACTIVE,
  });
}

export async function updateTopic(
  id: number,
  data: { name?: string; description?: string; imageUrl?: string | null; order?: number; status?: TopicStatus }
) {
  const topic = await Topic.findByPk(id);
  if (!topic) throw new Error('Topic not found');

  // Duplicate check on rename (within the same chapter)
  if (data.name) {
    const existing = await Topic.findOne({
      where: {
        chapterId: (topic as any).chapterId,
        name: { [Op.like]: data.name.trim() },
        id: { [Op.ne]: id },
      },
    });
    if (existing) {
      throw {
        statusCode: 409,
        code: ERROR_CODES.TOPIC_ALREADY_EXISTS,
        message: `A topic named "${data.name.trim()}" already exists in this chapter. Please use a different name.`,
      };
    }
  }

  return topic.update(data);
}

export async function deleteTopic(id: number) {
  const topic = await Topic.findByPk(id);
  if (topic) await topic.destroy();
  return topic;
}

// ----------------------------------------------------
// CONTENT MANAGEMENT
// ----------------------------------------------------
export async function listContent(params?: {
  topicId?: number;
  chapterId?: number;
  type?: ContentType;
  status?: ContentStatus;
  page?: number;
  limit?: number;
}): Promise<PaginatedResult<any>> {
  const page = Math.max(1, params?.page || 1);
  const limit = Math.min(100, Math.max(1, params?.limit || DEFAULT_PAGE_SIZE));
  const offset = (page - 1) * limit;

  const where: any = {};
  if (params?.topicId) where.topicId = params.topicId;
  if (params?.chapterId) where.chapterId = params.chapterId;
  if (params?.type) where.type = params.type;
  if (params?.status) where.status = params.status;

  const { count: total, rows: items } = await Content.findAndCountAll({
    where,
    offset,
    limit,
    order: [['order', 'ASC']],
    include: [
      {
        model: Topic,
        as: 'topic',
        required: false,
        include: [
          {
            model: Chapter,
            as: 'chapter',
            include: [
              {
                model: Subject,
                as: 'subject',
                include: ['class'],
              },
            ],
          },
        ],
      },
      {
        model: Chapter,
        as: 'chapter',
        required: false,
        include: [
          {
            model: Subject,
            as: 'subject',
            include: ['class'],
          },
        ],
      },
    ],
  });

  const totalPages = Math.ceil(total / limit);

  return {
    items,
    pagination: {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
}

export async function getContentById(id: number) {
  const content = await Content.findByPk(id, {
    include: [
      {
        model: Topic,
        as: 'topic',
        include: [
          {
            model: Chapter,
            as: 'chapter',
            include: [
              {
                model: Subject,
                as: 'subject',
                include: ['class'],
              },
            ],
          },
        ],
      },
    ],
  });

  if (!content) {
    throw {
      statusCode: 404,
      code: ERROR_CODES.CONTENT_NOT_FOUND,
      message: 'Content item not found',
    };
  }

  return content;
}

export async function createContent(data: {
  topicId?: number;
  chapterId?: number;
  title: string;
  type: ContentType;
  url: string;
  thumbnailUrl?: string | null;
  description?: string;
  order?: number;
  status?: ContentStatus;
  metadata?: any;
}) {
  if ((!data.topicId && !data.chapterId) || (data.topicId && data.chapterId)) {
    throw {
      statusCode: 400,
      code: 'INVALID_CONTENT_PARENT',
      message: 'Content must belong to EITHER a topicId OR a chapterId (not both and not neither).',
    };
  }

  if (data.topicId) {
    const topic = await Topic.findByPk(data.topicId);
    if (!topic) {
      throw { statusCode: 404, code: ERROR_CODES.TOPIC_NOT_FOUND, message: 'Topic not found' };
    }
  }

  if (data.chapterId) {
    const chapter = await Chapter.findByPk(data.chapterId);
    if (!chapter) {
      throw { statusCode: 404, code: ERROR_CODES.CHAPTER_NOT_FOUND, message: 'Chapter not found' };
    }
  }

  // Duplicate check: same title (case-insensitive) within the same topic or chapter
  const duplicateWhere: any = { title: { [Op.like]: data.title.trim() } };
  if (data.topicId) duplicateWhere.topicId = data.topicId;
  else duplicateWhere.chapterId = data.chapterId;

  const existingContent = await Content.findOne({ where: duplicateWhere });
  if (existingContent) {
    const parentLabel = data.topicId ? 'topic' : 'chapter';
    throw {
      statusCode: 409,
      code: ERROR_CODES.CONTENT_ALREADY_EXISTS,
      message: `A learning content titled "${data.title.trim()}" already exists in this ${parentLabel}. Please use a different title.`,
    };
  }

  return Content.create({
    topicId: data.topicId || null,
    chapterId: data.chapterId || null,
    title: data.title.trim(),
    type: data.type,
    url: data.url.trim(),
    thumbnailUrl: data.thumbnailUrl ? data.thumbnailUrl.trim() : null,
    description: data.description,
    order: data.order ?? 0,
    status: data.status || ContentStatus.VISIBLE,
    metadata: data.metadata || {},
  });
}

export async function updateContent(
  id: number,
  data: {
    topicId?: number;
    chapterId?: number;
    title?: string;
    type?: ContentType;
    url?: string;
    thumbnailUrl?: string | null;
    description?: string;
    order?: number;
    status?: ContentStatus;
    metadata?: any;
  }
) {
  const content = await Content.findByPk(id);
  if (!content) throw new Error('Content not found');

  const targetTopicId = data.topicId !== undefined ? data.topicId : content.topicId;
  const targetChapterId = data.chapterId !== undefined ? data.chapterId : content.chapterId;

  if ((!targetTopicId && !targetChapterId) || (targetTopicId && targetChapterId)) {
    throw {
      statusCode: 400,
      code: 'INVALID_CONTENT_PARENT',
      message: 'Content must belong to EITHER a topicId OR a chapterId (not both and not neither).',
    };
  }

  // Duplicate check on rename (within the same topic/chapter)
  if (data.title) {
    const targetTopicId2 = data.topicId !== undefined ? data.topicId : content.topicId;
    const targetChapterId2 = data.chapterId !== undefined ? data.chapterId : content.chapterId;
    const dupWhere: any = { title: { [Op.like]: data.title.trim() }, id: { [Op.ne]: id } };
    if (targetTopicId2) dupWhere.topicId = targetTopicId2;
    else if (targetChapterId2) dupWhere.chapterId = targetChapterId2;

    const existingContent = await Content.findOne({ where: dupWhere });
    if (existingContent) {
      const parentLabel = targetTopicId2 ? 'topic' : 'chapter';
      throw {
        statusCode: 409,
        code: ERROR_CODES.CONTENT_ALREADY_EXISTS,
        message: `A learning content titled "${data.title.trim()}" already exists in this ${parentLabel}. Please use a different title.`,
      };
    }
  }

  return content.update(data);
}

export async function updateContentVisibility(id: number, status: ContentStatus) {
  const content = await Content.findByPk(id);
  if (!content) throw new Error('Content not found');
  return content.update({ status });
}

export async function deleteContent(id: number) {
  const content = await Content.findByPk(id);
  if (content) await content.destroy();
  return content;
}
