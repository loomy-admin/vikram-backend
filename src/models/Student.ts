import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database';
import { StudentStatus } from '../types/enums';

export const Student: any = sequelize.define('Student', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: true,
      unique: true,
    },
    rollNumber: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    city: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    state: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    passwordHash: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    phone: {
      type: DataTypes.STRING(50),
      allowNull: true,
      unique: true,
    },
    schoolId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    classId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM(...Object.values(StudentStatus)),
      defaultValue: StudentStatus.PENDING,
      allowNull: false,
    },
    lastLoginAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },  {
    tableName: 'students',
    indexes: [
      { fields: ['email'] },
      { fields: ['phone'] },
      { fields: ['schoolId'] },
      { fields: ['classId'] },
      { fields: ['status'] },
    ],
  });
