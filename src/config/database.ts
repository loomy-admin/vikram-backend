import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

dotenv.config();

const dbName = process.env.DB_NAME as string;
const dbUser = process.env.DB_USER as string;
const dbPassword = process.env.DB_PASSWORD as string;
const dbHost = process.env.DB_HOST || 'localhost';
const dbPort = process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306;

if (!dbName || !dbUser) {
  throw new Error('Database configuration (DB_NAME, DB_USER) is missing in environment variables');
}

export async function ensureDatabaseExists() {
  // If connecting to a cloud host or defaultdb, database already exists
  if (dbHost !== 'localhost' && dbHost !== '127.0.0.1') {
    return;
  }

  try {
    const connection = await mysql.createConnection({
      host: dbHost,
      port: dbPort,
      user: dbUser,
      password: dbPassword,
    });
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);
    await connection.end();
  } catch (err) {
    console.warn('[Database] Could not auto-create local database schema, proceeding with existing connection.');
  }
}

const isCloudDb = dbHost !== 'localhost' && dbHost !== '127.0.0.1';
const enableSsl = process.env.DB_SSL === 'true' || isCloudDb;

export const sequelize = new Sequelize(dbName, dbUser, dbPassword, {
  host: dbHost,
  port: dbPort,
  dialect: 'mysql',
  logging: false,
  dialectOptions: {
    connectTimeout: 20000,
    ...(enableSsl
      ? {
        ssl: {
          rejectUnauthorized: false,
        },
      }
      : {}),
  },
  pool: {
    max: 10,
    min: 0,
    acquire: 20000,
    idle: 10000,
  },

  define: {
    timestamps: true,
    underscored: false,
  },
});

