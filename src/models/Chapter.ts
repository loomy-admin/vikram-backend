import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database';
import { ChapterStatus } from '../types/enums';

export const Chapter: any = sequelize.define('Chapter', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    subjectId: {
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
      type: DataTypes.ENUM(...Object.values(ChapterStatus)),
      defaultValue: ChapterStatus.ACTIVE,
      allowNull: false,
    },
  },  {
    tableName: 'chapters',
    indexes: [
      { fields: ['subjectId'] },
      { fields: ['status'] },
    ],
  });
