import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database';
import { PublisherStatus } from '../types/enums';

export const Publisher: any = sequelize.define('Publisher', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  contactPerson: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: true,
    unique: true,
  },
  phone: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM(...Object.values(PublisherStatus)),
    defaultValue: PublisherStatus.ACTIVE,
    allowNull: false,
  },
}, {
  tableName: 'publishers',
  indexes: [
    { fields: ['email'] },
    { fields: ['status'] },
  ],
});
