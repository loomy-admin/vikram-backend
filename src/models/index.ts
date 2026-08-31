import { sequelize } from '../config/database';
import { School } from './School';
import { Class } from './Class';
import { Student } from './Student';
import { AccessCode } from './AccessCode';
import { AdminUser } from './AdminUser';
import { Subject } from './Subject';
import { Chapter } from './Chapter';
import { Topic } from './Topic';
import { Content } from './Content';
import { ContentProgress } from './ContentProgress';
import { OtpRecord } from './OtpRecord';
import { Publisher } from './Publisher';
import { Book } from './Book';
import { SchoolBookRequest } from './SchoolBookRequest';

// Setup Associations

// School <-> Student (1:N)
School.hasMany(Student, { foreignKey: 'schoolId', as: 'students' });
Student.belongsTo(School, { foreignKey: 'schoolId', as: 'school' });

// School <-> AccessCode (1:N)
School.hasMany(AccessCode, { foreignKey: 'schoolId', as: 'accessCodes' });
AccessCode.belongsTo(School, { foreignKey: 'schoolId', as: 'school' });

// School <-> SchoolBookRequest (1:N)
School.hasMany(SchoolBookRequest, { foreignKey: 'schoolId', as: 'bookRequests' });
SchoolBookRequest.belongsTo(School, { foreignKey: 'schoolId', as: 'school' });

// Class <-> Student (1:N)
Class.hasMany(Student, { foreignKey: 'classId', as: 'students' });
Student.belongsTo(Class, { foreignKey: 'classId', as: 'class' });

// Class <-> Subject (1:N)
Class.hasMany(Subject, { foreignKey: 'classId', as: 'subjects' });
Subject.belongsTo(Class, { foreignKey: 'classId', as: 'class' });

// AccessCode <-> Student (1:1)
AccessCode.belongsTo(Student, { foreignKey: 'studentId', as: 'student' });
Student.hasOne(AccessCode, { foreignKey: 'studentId', as: 'accessCode' });

// Publisher <-> Book (1:N)
Publisher.hasMany(Book, { foreignKey: 'publisherId', as: 'books' });
Book.belongsTo(Publisher, { foreignKey: 'publisherId', as: 'publisher' });

// Class <-> Book (1:N)
Class.hasMany(Book, { foreignKey: 'classId', as: 'books' });
Book.belongsTo(Class, { foreignKey: 'classId', as: 'class' });

// Subject <-> Book (1:N)
Subject.hasMany(Book, { foreignKey: 'subjectId', as: 'books' });
Book.belongsTo(Subject, { foreignKey: 'subjectId', as: 'subject' });

// Book <-> AccessCode (1:N)
Book.hasMany(AccessCode, { foreignKey: 'bookId', as: 'accessCodes' });
AccessCode.belongsTo(Book, { foreignKey: 'bookId', as: 'book' });

// Book <-> SchoolBookRequest (1:N)
Book.hasMany(SchoolBookRequest, { foreignKey: 'bookId', as: 'bookRequests' });
SchoolBookRequest.belongsTo(Book, { foreignKey: 'bookId', as: 'book' });

// Publisher <-> SchoolBookRequest (1:N)
Publisher.hasMany(SchoolBookRequest, { foreignKey: 'publisherId', as: 'bookRequests' });
SchoolBookRequest.belongsTo(Publisher, { foreignKey: 'publisherId', as: 'publisher' });

// Subject <-> Chapter (1:N)
Subject.hasMany(Chapter, { foreignKey: 'subjectId', as: 'chapters' });
Chapter.belongsTo(Subject, { foreignKey: 'subjectId', as: 'subject' });

// Chapter <-> Topic (1:N)
Chapter.hasMany(Topic, { foreignKey: 'chapterId', as: 'topics' });
Topic.belongsTo(Chapter, { foreignKey: 'chapterId', as: 'chapter' });

// Topic <-> Content (1:N)
Topic.hasMany(Content, { foreignKey: 'topicId', as: 'contents' });
Content.belongsTo(Topic, { foreignKey: 'topicId', as: 'topic' });

// Chapter <-> Content (1:N for direct contents)
Chapter.hasMany(Content, { foreignKey: 'chapterId', as: 'contents' });
Content.belongsTo(Chapter, { foreignKey: 'chapterId', as: 'chapter' });

// Student <-> ContentProgress (1:N)
Student.hasMany(ContentProgress, { foreignKey: 'studentId', as: 'progress' });
ContentProgress.belongsTo(Student, { foreignKey: 'studentId', as: 'student' });

// Content <-> ContentProgress (1:N)
Content.hasMany(ContentProgress, { foreignKey: 'contentId', as: 'progress' });
ContentProgress.belongsTo(Content, { foreignKey: 'contentId', as: 'content' });

export {
  sequelize,
  School,
  Class,
  Student,
  AccessCode,
  AdminUser,
  Subject,
  Chapter,
  Topic,
  Content,
  ContentProgress,
  OtpRecord,
  Publisher,
  Book,
  SchoolBookRequest,
};
