import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database';
import { TopicStatus } from '../types/enums';

export const Topic: any = sequelize.define('Topic', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    chapterId: {
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
      type: DataTypes.ENUM(...Object.values(TopicStatus)),
      defaultValue: TopicStatus.ACTIVE,
      allowNull: false,
    },
  },  {
    tableName: 'topics',
    indexes: [
      { fields: ['chapterId'] },
      { fields: ['status'] },
    ],
  });
