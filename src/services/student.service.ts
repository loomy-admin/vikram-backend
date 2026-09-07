import { StudentStatus, ContentStatus, SubjectStatus, ChapterStatus, TopicStatus, SchoolStatus, ClassStatus } from '../types/enums';
import { Student, School, Class, Subject, Chapter, Topic, Content, ContentProgress, AccessCode } from '../models';
import { signJwt } from '../utils/jwt';
import { ERROR_CODES } from '../constants';
import { logger } from '../utils/logger';
import { Op } from 'sequelize';

/**
 * Register a new student after verified OTP session.
 * New student starts with status = PENDING.
 */
export async function registerStudent(data: {
  name: string;
  schoolId: number;
  classId: number;
  email?: string | null;
  phone?: string | null;
  city?: string | null;
  state?: string | null;
  rollNumber?: string;
}) {
  if (!data.email && !data.phone) {
    throw {
      statusCode: 400,
      code: ERROR_CODES.VALIDATION_ERROR,
      message: 'Student must have verified email or phone',
    };
  }

  // Verify school exists and is active
  const school = await School.findByPk(data.schoolId);

  if (!school) {
    throw {
      statusCode: 404,
      code: ERROR_CODES.SCHOOL_NOT_FOUND,
      message: 'Selected school was not found',
    };
  }

  if (school.status === SchoolStatus.INACTIVE) {
    throw {
      statusCode: 400,
      code: ERROR_CODES.SCHOOL_INACTIVE,
      message: 'Selected school is currently inactive',
    };
  }

  // Verify class exists and is active
  const classRecord = await Class.findByPk(data.classId);

  if (!classRecord) {
    throw {
      statusCode: 404,
      code: ERROR_CODES.CLASS_NOT_FOUND,
      message: 'Selected class was not found',
    };
  }

  if (classRecord.status === ClassStatus.INACTIVE) {
    throw {
      statusCode: 400,
      code: ERROR_CODES.CLASS_INACTIVE,
      message: 'Selected class is currently inactive',
    };
  }

  // Check for existing student
  let existingStudent: any = null;
  if (data.email) {
    existingStudent = await Student.findOne({
      where: { email: data.email?.trim().toLowerCase() },
    });
  }
  if (!existingStudent && data.phone) {
    existingStudent = await Student.findOne({
      where: { phone: data.phone?.trim() },
    });
  }

  let student: any;

  if (existingStudent) {
    // If student is already ACTIVE, throw duplicate error
    if (existingStudent.status === StudentStatus.ACTIVE) {
      throw {
        statusCode: 409,
        code: ERROR_CODES.STUDENT_ALREADY_EXISTS,
        message: 'A student account is already active with this email/phone',
      };
    }

    // If student is PENDING, allow updating registration details
    await existingStudent.update({
      name: data.name.trim(),
      schoolId: data.schoolId,
      classId: data.classId,
      city: data.city?.trim() || null,
      state: data.state?.trim() || null,
      rollNumber: data.rollNumber?.trim() || null,
      lastLoginAt: new Date(),
    });
    student = existingStudent;
  } else {
    // Create student with PENDING status
    student = await Student.create({
      name: data.name.trim(),
      email: data.email?.trim().toLowerCase() || null,
      phone: data.phone?.trim() || null,
      schoolId: data.schoolId,
      classId: data.classId,
      city: data.city?.trim() || null,
      state: data.state?.trim() || null,
      rollNumber: data.rollNumber?.trim() || null,
      status: StudentStatus.PENDING,
      lastLoginAt: new Date(),
    });
  }

  // Reload to include relations for output
  await student.reload({
    include: [
      { model: School, as: 'school', attributes: ['id', 'name', 'schoolCode'] },
      { model: Class, as: 'class', attributes: ['id', 'name', 'grade'] },
    ],
  });

  logger.info(`New student registered with PENDING status: ID ${student.id} (${student.name})`);

  // Issue student JWT token
  const token = signJwt({
    userId: student.id,
    role: 'STUDENT',
    email: student.email,
    phone: student.phone,
    schoolId: student.schoolId,
    classId: student.classId,
    status: student.status,
  });

  return {
    token,
    student: {
      id: student.id,
      name: student.name,
      email: student.email,
      phone: student.phone,
      status: student.status,
      school: (student as any).school,
      class: (student as any).class,
      createdAt: student.createdAt,
    },
  };
}

/**
 * Get student profile with current access code and class details.
 */
export async function getStudentProfile(studentId: number) {
  const student = await Student.findByPk(studentId, {
    include: [
      { model: School, as: 'school', attributes: ['id', 'name', 'schoolCode', 'status', 'contactPerson', 'phone', 'email'] },
      { model: Class, as: 'class', attributes: ['id', 'name', 'grade', 'status'] },
      { model: AccessCode, as: 'accessCode', attributes: ['id', 'code', 'status', 'usedAt'] },
    ],
  });

  if (!student) {
    throw {
      statusCode: 404,
      code: ERROR_CODES.STUDENT_NOT_FOUND,
      message: 'Student record not found',
    };
  }

  return student;
}

/**
 * Get student Home feed:
 * - Student information
 * - Subjects for student's class with progress count
 * - Recently accessed content
 * - Continue learning topic suggestion
 */
export async function getStudentHomeFeed(studentId: number, classId?: number) {
  const student = await Student.findByPk(studentId, {
    include: [
      { model: Class, as: 'class' },
      { model: School, as: 'school' },
    ],
  });

  if (!student) {
    throw {
      statusCode: 404,
      code: ERROR_CODES.STUDENT_NOT_FOUND,
      message: 'Student not found',
    };
  }

  const effectiveClassId = classId || student.classId;

  // Subjects for the student's class (or active subjects)
  const subjectsWhere = effectiveClassId
    ? { classId: effectiveClassId, status: SubjectStatus.ACTIVE }
    : { status: SubjectStatus.ACTIVE };

  const subjects = await Subject.findAll({
    where: subjectsWhere,
    order: [['order', 'ASC']],
    // Sequelize alternative to _count: we can fetch chapters and map length
    include: [{ model: Chapter, as: 'chapters', attributes: ['id'] }],
  });

  // Recent content progress
  const recentProgress = await ContentProgress.findAll({
    where: { studentId },
    order: [['lastAccessedAt', 'DESC']],
    limit: 5,
    include: [
      {
        model: Content,
        as: 'content',
        include: [
          {
            model: Topic,
            as: 'topic',
            required: false,
            include: [
              {
                model: Chapter,
                as: 'chapter',
                include: [{ model: Subject, as: 'subject' }],
              },
            ],
          },
          {
            model: Chapter,
            as: 'chapter',
            required: false,
            include: [{ model: Subject, as: 'subject' }],
          },
        ],
      },
    ],
  });

  // Compute progress stats
  const totalCompleted = await ContentProgress.count({
    where: { studentId, completed: true },
  });

  return {
    student: {
      id: student.id,
      name: student.name,
      status: student.status,
      class: (student as any).class,
      school: (student as any).school,
    },
    stats: {
      totalCompletedContents: totalCompleted,
    },
    subjects: subjects.map((sub: any) => ({
      id: sub.id,
      name: sub.name,
      description: sub.description,
      imageUrl: sub.imageUrl || null,
      totalChapters: sub.chapters?.length || 0,
    })),
    recentContent: recentProgress.map((p: any) => {
      const cnt = p.content;
      const top = cnt.topic;
      const chap = top ? top.chapter : cnt.chapter;
      const subj = chap ? chap.subject : null;

      return {
        id: cnt.id,
        contentId: cnt.id,
        title: cnt.title,
        type: cnt.type,
        url: cnt.url,
        thumbnailUrl: cnt.thumbnailUrl || null,
        topicId: top?.id || null,
        chapterId: chap?.id || null,
        topicName: top?.name || null,
        chapterName: chap?.name || '',
        subjectName: subj?.name || '',
        completed: p.completed,
        lastAccessedAt: p.lastAccessedAt,
      };
    }),
  };
}

/**
 * Get all active subjects for student's registered class.
 */
export async function getSubjectsForStudent(classId?: number) {
  const where = classId
    ? { classId, status: SubjectStatus.ACTIVE }
    : { status: SubjectStatus.ACTIVE };

  const subjects = await Subject.findAll({
    where,
    order: [['order', 'ASC']],
    include: [{ model: Chapter, as: 'chapters', attributes: ['id'] }],
  });

  return subjects.map((sub: any) => ({
    ...sub.toJSON(),
    _count: { chapters: sub.chapters?.length || 0 },
  }));
}

/**
 * Get all active chapters for a subject (scoped to student's class).
 */
export async function getChaptersForSubject(subjectId: number, classId: number) {
  const subject = await Subject.findOne({
    where: { id: subjectId, classId, status: SubjectStatus.ACTIVE },
  });

  if (!subject) {
    throw {
      statusCode: 404,
      code: ERROR_CODES.SUBJECT_NOT_FOUND,
      message: 'Subject not found or does not belong to your class',
    };
  }

  const chapters = await Chapter.findAll({
    where: {
      subjectId,
      status: ChapterStatus.ACTIVE,
    },
    order: [['order', 'ASC']],
    include: [
      { model: Topic, as: 'topics', attributes: ['id'] },
      { model: Content, as: 'contents', attributes: ['id'] },
    ],
  });

  return {
    subject: {
      id: subject.id,
      name: subject.name,
      description: subject.description,
    },
    chapters: chapters.map((chap: any) => ({
      ...chap.toJSON(),
      _count: {
        topics: chap.topics?.length || 0,
        contents: chap.contents?.length || 0,
      },
    })),
  };
}

/**
 * Get all active topics for a chapter, along with direct chapter content if no topics exist.
 */
export async function getTopicsForChapter(chapterId: number, classId: number) {
  const chapter = await Chapter.findOne({
    where: {
      id: chapterId,
      status: ChapterStatus.ACTIVE,
    },
    include: [
      {
        model: Subject,
        as: 'subject',
        where: { classId, status: SubjectStatus.ACTIVE },
      },
    ],
  });

  if (!chapter) {
    throw {
      statusCode: 404,
      code: ERROR_CODES.CHAPTER_NOT_FOUND,
      message: 'Chapter not found or does not belong to your class',
    };
  }

  const [topics, directContents] = await Promise.all([
    Topic.findAll({
      where: {
        chapterId,
        status: TopicStatus.ACTIVE,
      },
      order: [['order', 'ASC']],
      include: [{ model: Content, as: 'contents', attributes: ['id'] }],
    }),
    Content.findAll({
      where: {
        chapterId,
        status: ContentStatus.VISIBLE,
      },
      order: [['order', 'ASC']],
    }),
  ]);

  return {
    subject: (chapter as any).subject,
    chapter: {
      id: chapter.id,
      name: chapter.name,
      description: chapter.description,
    },
    hasTopics: topics.length > 0,
    hasDirectContent: directContents.length > 0,
    topics: topics.map((topic: any) => ({
      ...topic.toJSON(),
      _count: { contents: topic.contents?.length || 0 },
    })),
    directContents: directContents.map((c: any) => c.toJSON()),
  };
}

/**
 * Get topic details along with all visible content items and student completion status.
 */
export async function getTopicDetails(topicId: number, studentId: number, classId: number) {
  const topic = await Topic.findOne({
    where: {
      id: topicId,
      status: TopicStatus.ACTIVE,
    },
    include: [
      {
        model: Chapter,
        as: 'chapter',
        where: { status: ChapterStatus.ACTIVE },
        include: [
          {
            model: Subject,
            as: 'subject',
            where: { classId, status: SubjectStatus.ACTIVE },
          },
        ],
      },
      {
        model: Content,
        as: 'contents',
        where: { status: ContentStatus.VISIBLE },
        required: false,
      },
    ],
    order: [[{ model: Content, as: 'contents' }, 'order', 'ASC']],
  });

  if (!topic) {
    throw {
      statusCode: 404,
      code: ERROR_CODES.TOPIC_NOT_FOUND,
      message: 'Topic not found or not available for your class',
    };
  }

  const topicContents = (topic as any).contents || [];

  // Fetch student's progress on these contents
  const progressRecords = await ContentProgress.findAll({
    where: {
      studentId,
      contentId: { [Op.in]: topicContents.map((c: any) => c.id) },
    },
  });

  const progressMap = new Map<number, any>(progressRecords.map((p: any) => [p.contentId, p]));

  const contentsWithProgress = topicContents.map((content: any) => {
    const progress: any = progressMap.get(content.id);
    return {
      id: content.id,
      title: content.title,
      type: content.type,
      url: content.url,
      thumbnailUrl: content.thumbnailUrl || null,
      description: content.description,
      order: content.order,
      metadata: content.metadata,
      isCompleted: progress?.completed ?? false,
      completedAt: progress?.completedAt ?? null,
      lastAccessedAt: progress?.lastAccessedAt ?? null,
    };
  });

  return {
    subject: (topic as any).chapter.subject,
    chapter: {
      id: (topic as any).chapter.id,
      name: (topic as any).chapter.name,
    },
    topic: {
      id: topic.id,
      name: topic.name,
      description: topic.description,
    },
    contents: contentsWithProgress,
  };
}

/**
 * Get single content details and record access.
 */
export async function getContentDetails(contentId: number, studentId: number, classId: number) {
  const now = new Date();
  const [content, progressResult] = await Promise.all([
    Content.findOne({
      where: {
        id: contentId,
        status: ContentStatus.VISIBLE,
      },
      include: [
        {
          model: Topic,
          as: 'topic',
          required: false,
          where: { status: TopicStatus.ACTIVE },
          include: [
            {
              model: Chapter,
              as: 'chapter',
              where: { status: ChapterStatus.ACTIVE },
              include: [
                {
                  model: Subject,
                  as: 'subject',
                  where: { classId, status: SubjectStatus.ACTIVE },
                },
              ],
            },
          ],
        },
        {
          model: Chapter,
          as: 'chapter',
          required: false,
          where: { status: ChapterStatus.ACTIVE },
          include: [
            {
              model: Subject,
              as: 'subject',
              where: { classId, status: SubjectStatus.ACTIVE },
            },
          ],
        },
      ],
    }),
    (async () => {
      let rec = await ContentProgress.findOne({ where: { studentId, contentId } });
      if (rec) {
        return rec.update({ lastAccessedAt: now });
      }
      return ContentProgress.create({
        studentId,
        contentId,
        lastAccessedAt: now,
        completed: false,
      });
    })(),
  ]);

  if (!content) {
    throw {
      statusCode: 404,
      code: ERROR_CODES.CONTENT_NOT_FOUND,
      message: 'Content not found or not available for your class',
    };
  }

  const progress = progressResult;

  const topic = (content as any).topic;
  const chapter = topic ? topic.chapter : (content as any).chapter;
  const subject = chapter ? chapter.subject : null;

  return {
    id: content.id,
    title: content.title,
    type: content.type,
    url: content.url,
    description: content.description,
    metadata: content.metadata,
    topicName: topic?.name || null,
    chapterName: chapter?.name || '',
    subjectName: subject?.name || '',
    isCompleted: progress.completed,
    completedAt: progress.completedAt,
    lastAccessedAt: progress.lastAccessedAt,
  };
}

/**
 * Log access timestamp for content item.
 */
export async function logContentAccess(contentId: number, studentId: number) {
  let progress = await ContentProgress.findOne({ where: { studentId, contentId } });
  if (progress) {
    return progress.update({ lastAccessedAt: new Date() });
  } else {
    return ContentProgress.create({
      studentId,
      contentId,
      lastAccessedAt: new Date(),
      completed: false,
    });
  }
}

/**
 * Mark content as completed.
 */
export async function markContentCompleted(contentId: number, studentId: number) {
  // Verify content exists
  const content = await Content.findByPk(contentId);

  if (!content) {
    throw {
      statusCode: 404,
      code: ERROR_CODES.CONTENT_NOT_FOUND,
      message: 'Content not found',
    };
  }

  let progress = await ContentProgress.findOne({ where: { studentId, contentId } });
  const now = new Date();

  if (progress) {
    const nextCompletedState = !progress.completed;
    progress = await progress.update({
      completed: nextCompletedState,
      completedAt: nextCompletedState ? now : null,
      lastAccessedAt: now,
    });
  } else {
    progress = await ContentProgress.create({
      studentId,
      contentId,
      completed: true,
      completedAt: now,
      lastAccessedAt: now,
    });
  }

  return {
    contentId,
    completed: progress.completed,
    completedAt: progress.completedAt,
  };
}

/**
 * Get recently accessed content for the authenticated student.
 */
export async function getRecentContent(studentId: number, limit: number = 10) {
  const progressList = await ContentProgress.findAll({
    where: { studentId },
    order: [['lastAccessedAt', 'DESC']],
    limit,
    include: [
      {
        model: Content,
        as: 'content',
        include: [
          {
            model: Topic,
            as: 'topic',
            required: false,
            include: [
              {
                model: Chapter,
                as: 'chapter',
                include: [{ model: Subject, as: 'subject' }],
              },
            ],
          },
          {
            model: Chapter,
            as: 'chapter',
            required: false,
            include: [{ model: Subject, as: 'subject' }],
          },
        ],
      },
    ],
  });

  return progressList.map((p: any) => {
    const cnt = p.content;
    const top = cnt.topic;
    const chap = top ? top.chapter : cnt.chapter;
    const subj = chap ? chap.subject : null;

    return {
      id: cnt.id,
      contentId: cnt.id,
      title: cnt.title,
      type: cnt.type,
      url: cnt.url,
      thumbnailUrl: cnt.thumbnailUrl || null,
      description: cnt.description,
      topicId: top ? top.id : undefined,
      chapterId: chap ? chap.id : undefined,
      topicName: top ? top.name : null,
      chapterName: chap ? chap.name : '',
      subjectName: subj ? subj.name : '',
      completed: p.completed,
      completedAt: p.completedAt,
      lastAccessedAt: p.lastAccessedAt,
    };
  });
}
