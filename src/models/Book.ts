import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database';
import { BookStatus } from '../types/enums';

export const Book: any = sequelize.define('Book', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  isbn: {
    type: DataTypes.STRING(100),
    allowNull: true,
    unique: true,
  },
  edition: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  classId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  subjectId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  publisherId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM(...Object.values(BookStatus)),
    defaultValue: BookStatus.ACTIVE,
    allowNull: false,
  },
}, {
  tableName: 'books',
  indexes: [
    { fields: ['isbn'] },
    { fields: ['classId'] },
    { fields: ['subjectId'] },
    { fields: ['publisherId'] },
    { fields: ['status'] },
  ],
});
