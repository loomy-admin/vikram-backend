import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database';
import { ClassStatus } from '../types/enums';

export const Class: any = sequelize.define('Class', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    grade: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM(...Object.values(ClassStatus)),
      defaultValue: ClassStatus.ACTIVE,
      allowNull: false,
    },
  },  {
    tableName: 'classes',
    indexes: [
      { fields: ['status'] },
      { fields: ['grade'] },
    ],
  });
