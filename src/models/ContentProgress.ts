import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database';

export const ContentProgress: any = sequelize.define('ContentProgress', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    studentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    contentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    completed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    lastAccessedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false,
    },
  },  {
    tableName: 'content_progress',
    timestamps: false, // Schema specifies lastAccessedAt defaulting to now(), but no createdAt/updatedAt explicitly. Let's rely on explicit fields.
    indexes: [
      { fields: ['studentId'] },
      { fields: ['contentId'] },
      { fields: ['lastAccessedAt'] },
      { fields: ['studentId', 'contentId'], unique: true },
    ],
  });
