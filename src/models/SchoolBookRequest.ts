import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database';
import { RequestStatus } from '../types/enums';

export const SchoolBookRequest: any = sequelize.define('SchoolBookRequest', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  schoolId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  bookId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },
  publisherId: {
    type: DataTypes.INTEGER,
    allowNull: true, // Assigned later by Admin
  },
  status: {
    type: DataTypes.ENUM(...Object.values(RequestStatus)),
    defaultValue: RequestStatus.PENDING,
    allowNull: false,
  },
  requestDate: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'school_book_requests',
  indexes: [
    { fields: ['schoolId'] },
    { fields: ['bookId'] },
    { fields: ['publisherId'] },
    { fields: ['status'] },
  ],
});
