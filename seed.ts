import { sequelize, School, Class, AdminUser } from './src/models';
import bcrypt from 'bcrypt';

async function seed() {
  try {
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');

    // Sync database (in case tables don't exist yet)
    await sequelize.sync();

    console.log('Seeding admin...');
    const adminEmail = 'admin@example.com';
    const existingAdmin = await AdminUser.findOne({ where: { email: adminEmail } });
    if (!existingAdmin) {
      const passwordHash = await bcrypt.hash('admin123', 10);
      await AdminUser.create({
        name: 'Super Admin',
        email: adminEmail,
        passwordHash,
        status: 'ACTIVE',
      });
      console.log('Admin seeded (admin@example.com / admin123)');
    } else {
      console.log('Admin already exists.');
    }

    console.log('Seeding classes...');
    await Class.bulkCreate([
      { name: 'Grade 10', description: 'Tenth Grade', status: 'ACTIVE' },
      { name: 'Grade 11', description: 'Eleventh Grade', status: 'ACTIVE' },
      { name: 'Grade 12', description: 'Twelfth Grade', status: 'ACTIVE' }
    ], { ignoreDuplicates: true });

    console.log('Seeding schools...');
    await School.bulkCreate([
      { name: 'Springfield High', schoolCode: 'SHS123', status: 'ACTIVE' },
      { name: 'Shelbyville Academy', schoolCode: 'SBY456', status: 'ACTIVE' },
      { name: 'Capital City Tech', schoolCode: 'CCT789', status: 'ACTIVE' }
    ], { ignoreDuplicates: true });

    console.log('Seeding complete! You can now use the app.');
    process.exit(0);
  } catch (error) {
    console.error('Unable to connect to the database or seed:', error);
    process.exit(1);
  }
}

seed();
