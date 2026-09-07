import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database';
import { SubjectStatus } from '../types/enums';

export const Subject: any = sequelize.define('Subject', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    classId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    imageUrl: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    order: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM(...Object.values(SubjectStatus)),
      defaultValue: SubjectStatus.ACTIVE,
      allowNull: false,
    },
  },  {
    tableName: 'subjects',
    indexes: [
      { fields: ['classId'] },
      { fields: ['status'] },
    ],
  });
