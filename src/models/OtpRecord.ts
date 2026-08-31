import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database';
import { OtpChannel } from '../types/enums';

export const OtpRecord: any = sequelize.define('OtpRecord', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    identifier: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    channel: {
      type: DataTypes.ENUM(...Object.values(OtpChannel)),
      allowNull: false,
    },
    otpHash: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    attempts: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
    maxAttempts: {
      type: DataTypes.INTEGER,
      defaultValue: 5,
      allowNull: false,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    verifiedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false,
    },
  },  {
    tableName: 'otp_records',
    updatedAt: false, // Prisma schema only has createdAt
    indexes: [
      { fields: ['identifier'] },
      { fields: ['expiresAt'] },
    ],
  });
