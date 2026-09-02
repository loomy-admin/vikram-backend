import { Sequelize } from 'sequelize';

const DB_HOST =
  process.env.DB_HOST || 'studentlearning-studentlearning.d.aivencloud.com';
const DB_PORT = parseInt(process.env.DB_PORT || '15675', 10);
const DB_USER = process.env.DB_USER || 'avnadmin';
const DB_PASSWORD = process.env.DB_PASSWORD || 'YOUR_DB_PASSWORD';
const DB_NAME = process.env.DB_NAME || 'defaultdb';

const isCloud = DB_HOST !== 'localhost' && DB_HOST !== '127.0.0.1';

const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
  host: DB_HOST,
  port: DB_PORT,
  dialect: 'mysql',
  logging: false,
  dialectOptions: isCloud
    ? {
      ssl: {
        rejectUnauthorized: false,
      },
    }
    : undefined,
});

async function readStdin(): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = '';

    process.stdin.setEncoding('utf8');

    process.stdin.on('data', chunk => {
      data += chunk;
    });

    process.stdin.on('end', () => {
      resolve(data.trim());
    });

    process.stdin.on('error', reject);
  });
}

async function executeQuery() {
  let sql = '';

  // If SQL is supplied as command-line argument, keep existing behavior.
  if (process.argv.length > 2) {
    sql = process.argv.slice(2).join(' ').trim();
  } else {
    // Otherwise read complete SQL from stdin.
    sql = await readStdin();
  }

  if (!sql) {
    console.log('\n❌ Usage: npm run query "YOUR SQL QUERY HERE"\n');
    console.log('Or use a PowerShell here-string piped to npm run query.\n');
    process.exit(1);
  }

  try {
    console.log(
      `\n📡 Executing against Production DB (${DB_HOST})...\n`
    );

    const [results] = await sequelize.query(sql);

    console.log('--- RESULT ---');
    console.dir(results, {
      depth: null,
      colors: true,
    });

    console.log('\n✅ Query executed successfully!\n');
  } catch (error: any) {
    console.error(
      '\n❌ Query execution error:',
      error.message || error
    );
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

executeQuery();