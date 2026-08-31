import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database';
import { AccessCodeStatus } from '../types/enums';

export const AccessCode: any = sequelize.define('AccessCode', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    code: {
      type: DataTypes.STRING(10),
      allowNull: false,
      unique: true,
    },
    schoolId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    bookId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    studentId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      unique: true,
    },
    status: {
      type: DataTypes.ENUM(...Object.values(AccessCodeStatus)),
      defaultValue: AccessCodeStatus.UNUSED,
      allowNull: false,
    },
    usedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },  {
    tableName: 'access_codes',
    updatedAt: false, // Prisma schema only has createdAt and usedAt
    indexes: [
      { fields: ['code'] },
      { fields: ['schoolId'] },
      { fields: ['studentId'] },
      { fields: ['status'] },
    ],
  });
