import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database';
import { AdminStatus } from '../types/enums';

export const AdminUser: any = sequelize.define('AdminUser', {
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
      allowNull: false,
      unique: true,
    },
    passwordHash: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM(...Object.values(AdminStatus)),
      defaultValue: AdminStatus.ACTIVE,
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM('SUPER_ADMIN', 'ADMIN', 'PUBLISHER', 'SCHOOL'),
      defaultValue: 'ADMIN',
      allowNull: false,
    },
    publisherId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    schoolId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },  {
    tableName: 'admin_users',
    indexes: [
      { fields: ['email'] },
      { fields: ['status'] },
    ],
  });
