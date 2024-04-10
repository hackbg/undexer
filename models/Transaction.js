import { DataTypes } from 'sequelize';
import sequelize from '../db/index.js';

const Transaction = sequelize.define('transaction', {
  txId: {
    type: DataTypes.TEXT,
    unique: true,
    primaryKey: true,
  },
  blockId: {
    type: DataTypes.TEXT,
  },
  blockHeight: {
    type: DataTypes.INTEGER,
  },
  chainId: {
    type: DataTypes.TEXT,
  },
  expiration: {
    type: DataTypes.DATE,
  },
  timestamp: {
    type: DataTypes.DATE,
  },
  codeHash: {
    type: DataTypes.TEXT,
  },
  dataHash: {
    type: DataTypes.TEXT,
  },
  memoHash: {
    type: DataTypes.TEXT,
  },
  type: {
    type: DataTypes.TEXT,
  },
  feeAmountPerGasUnit: {
    type: DataTypes.TEXT,
  },
  feeToken: {
    type: DataTypes.TEXT,
  },
  multiplier: {
    type: DataTypes.TEXT,
  },
  gasLimitMultiplier: {
    type: DataTypes.TEXT,
  },
  sections: {
    type: DataTypes.JSONB,
  },
  content: {
    type: DataTypes.JSONB,
  },
});

export default Transaction;
