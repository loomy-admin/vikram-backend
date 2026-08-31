import { sequelize } from '../config/database';
import { Content } from '../models';

async function updateUrls() {
  try {
    await sequelize.authenticate();
    console.log('Database connected.');

    const contents = await Content.findAll();
    let updatedCount = 0;
    
    for (const content of contents) {
      const url = content.get('url') as string;
      if (url && url.startsWith('http://')) {
        const newUrl = url.replace('http://', 'https://');
        await content.update({ url: newUrl });
        updatedCount++;
      }
    }

    console.log(`Updated ${updatedCount} URLs to use HTTPS.`);
  } catch (error) {
    console.error('Error updating URLs:', error);
  } finally {
    process.exit(0);
  }
}

updateUrls();
