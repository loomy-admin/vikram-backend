import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database';
import { SchoolStatus } from '../types/enums';

export const School: any = sequelize.define('School', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    schoolCode: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    contactPerson: {
      type: DataTypes.STRING(150),
      allowNull: true,
    },
    phone: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM(...Object.values(SchoolStatus)),
      defaultValue: SchoolStatus.ACTIVE,
      allowNull: false,
    },
  },  {
    tableName: 'schools',
    indexes: [
      { fields: ['status'] },
      { fields: ['schoolCode'] },
    ],
  });
