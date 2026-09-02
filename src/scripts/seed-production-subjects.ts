import { Sequelize } from 'sequelize';

const DB_HOST = process.env.DB_HOST || 'studentlearning-studentlearning.d.aivencloud.com';
const DB_PORT = parseInt(process.env.DB_PORT || '15675', 10);
const DB_USER = process.env.DB_USER || 'avnadmin';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_NAME = process.env.DB_NAME || 'defaultdb';

const isCloud = DB_HOST !== 'localhost' && DB_HOST !== '127.0.0.1';

const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
  host: DB_HOST,
  port: DB_PORT,
  dialect: 'mysql',
  logging: console.log,
  dialectOptions: isCloud
    ? {
        ssl: {
          rejectUnauthorized: false,
        },
      }
    : undefined,
});

const STANDARD_SUBJECTS = [
  { name: 'Telugu', description: 'First Language Telugu literature, grammar, and reading comprehension.', order: 1 },
  { name: 'Hindi', description: 'Second Language Hindi reading, vocabulary, and grammar basics.', order: 2 },
  { name: 'English', description: 'English language, literature, grammar, and communication skills.', order: 3 },
  { name: 'Mathematics', description: 'Fundamental mathematics, algebra, geometry, and arithmetic.', order: 4 },
  { name: 'Science', description: 'General science topics covering Physical Science and Natural Science.', order: 5 },
  { name: 'Social Studies', description: 'History, Geography, Civics, and Economics.', order: 6 },
];

async function seedProductionSubjects() {
  try {
    console.log(`Connecting to Live Production Database at ${DB_HOST}:${DB_PORT}/${DB_NAME}...`);
    await sequelize.authenticate();
    console.log('✅ Connected to Live Production MySQL Database!');

    // Ensure Classes (Class 1 to Class 10) exist
    for (let grade = 1; grade <= 10; grade++) {
      const className = `Class ${grade}`;
      const [classRecords] = await sequelize.query(
        `SELECT id FROM \`classes\` WHERE \`grade\` = :grade LIMIT 1;`,
        { replacements: { grade } }
      );

      let classId: number;
      if (Array.isArray(classRecords) && classRecords.length > 0) {
        classId = (classRecords[0] as any).id;
      } else {
        const [insertResult]: any = await sequelize.query(
          `INSERT INTO \`classes\` (\`name\`, \`grade\`, \`status\`, \`createdAt\`, \`updatedAt\`) VALUES (:name, :grade, 'ACTIVE', NOW(), NOW());`,
          { replacements: { name: className, grade } }
        );
        classId = insertResult;
        console.log(`[+] Created ${className} (ID: ${classId})`);
      }

      // Add Subjects for this Class
      for (const subj of STANDARD_SUBJECTS) {
        const [existing] = await sequelize.query(
          `SELECT id FROM \`subjects\` WHERE \`classId\` = :classId AND \`name\` = :name LIMIT 1;`,
          { replacements: { classId, name: subj.name } }
        );

        if (Array.isArray(existing) && existing.length > 0) {
          console.log(`[=] ${className} -> ${subj.name} already exists (ID: ${(existing[0] as any).id})`);
        } else {
          await sequelize.query(
            `INSERT INTO \`subjects\` (\`classId\`, \`name\`, \`description\`, \`order\`, \`status\`, \`createdAt\`, \`updatedAt\`) VALUES (:classId, :name, :description, :order, 'ACTIVE', NOW(), NOW());`,
            {
              replacements: {
                classId,
                name: subj.name,
                description: subj.description,
                order: subj.order,
              },
            }
          );
          console.log(`[+] Inserted ${className} -> ${subj.name}`);
        }
      }
    }

    console.log('🎉 SUCCESSFULLY SEEDED ALL SUBJECTS IN PRODUCTION!');
  } catch (error) {
    console.error('❌ Error seeding subjects:', error);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

seedProductionSubjects();
