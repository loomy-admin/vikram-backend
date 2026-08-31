import { sequelize } from '../config/database';
import { Class, Subject, Chapter, Topic, Content } from '../models';
import { ClassStatus, SubjectStatus, ChapterStatus, TopicStatus, ContentStatus, ContentType } from '../types/enums';

async function seedData() {
  try {
    await sequelize.authenticate();
    console.log('Database connected.');

    // Find or create some classes if none exist
    let classes = await Class.findAll();
    if (classes.length === 0) {
      console.log('No classes found. Creating dummy classes...');
      const classData = [
        { name: 'Class 1', grade: 1, status: ClassStatus.ACTIVE },
        { name: 'Class 2', grade: 2, status: ClassStatus.ACTIVE },
        { name: 'Class 3', grade: 3, status: ClassStatus.ACTIVE },
        { name: 'Class 4', grade: 4, status: ClassStatus.ACTIVE },
        { name: 'Class 5', grade: 5, status: ClassStatus.ACTIVE }
      ];
      await Class.bulkCreate(classData);
      classes = await Class.findAll();
    } else {
        console.log(`Found ${classes.length} classes. Using existing classes.`);
    }

    for (const cls of classes) {
      const clsId = cls.get('id');
      const clsName = cls.get('name');
      console.log(`Seeding data for Class ID: ${clsId} (${clsName})`);
      
      const subject = await Subject.create({
        classId: clsId,
        name: `Dummy Science ${clsName}`,
        description: 'Science Dummy Data',
        order: 1,
        status: SubjectStatus.ACTIVE
      });

      const chapter = await Chapter.create({
        subjectId: subject.get('id'),
        name: 'Chapter 1: The Basics',
        description: 'Dummy Chapter',
        order: 1,
        status: ChapterStatus.ACTIVE
      });

      const topic = await Topic.create({
        chapterId: chapter.get('id'),
        name: 'Topic 1: Introduction',
        description: 'Dummy Topic',
        order: 1,
        status: TopicStatus.ACTIVE
      });

      await Content.bulkCreate([
        {
          topicId: topic.get('id'),
          title: 'Intro Video',
          description: 'A dummy video for testing.',
          type: ContentType.VIDEO,
          url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
          order: 1,
          status: ContentStatus.VISIBLE,
        },
        {
          topicId: topic.get('id'),
          title: 'Study Material PDF',
          description: 'A dummy PDF for testing.',
          type: ContentType.PDF,
          url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
          order: 2,
          status: ContentStatus.VISIBLE,
        }
      ]);
    }

    console.log('Seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    process.exit(0);
  }
}

seedData();
