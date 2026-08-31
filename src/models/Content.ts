import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database';
import { ContentType, ContentStatus } from '../types/enums';

export const Content: any = sequelize.define('Content', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    chapterId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'chapters',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    topicId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'topics',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM(...Object.values(ContentType)),
      allowNull: false,
    },
    url: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    order: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM(...Object.values(ContentStatus)),
      defaultValue: ContentStatus.VISIBLE,
      allowNull: false,
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
    },
  },  {
    tableName: 'contents',
    indexes: [
      { fields: ['chapterId'] },
      { fields: ['topicId'] },
      { fields: ['status'] },
      { fields: ['type'] },
    ],
  });
