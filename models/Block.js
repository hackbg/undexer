import { Sequelize, DataTypes } from 'sequelize';
import sequelize from '../db/index.js';
import { serialize } from './serialize';
import Transaction from './Transaction.js';

const Block = sequelize.define('block', {
  height: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    primaryKey: true,
  },
  id: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  header: {
    type: DataTypes.JSON,
    allowNull: false,
    get() {
      return JSON.parse(this.getDataValue('header'));
    },
    set(value) {
      return this.setDataValue('header', serialize(value));
    },
  },
  results: {
    type: DataTypes.JSON,
    allowNull: false,
    get() {
      return JSON.parse(this.getDataValue('results'));
    },
    set(value) {
      return this.setDataValue('results', serialize(value));
    },
  },
  rpcResponse: {
    type: DataTypes.JSON,
    allowNull: false,
    get() {
      return JSON.parse(this.getDataValue('rpcResponse'));
    },
    set(value) {
      return this.setDataValue('rpcResponse', serialize(value));
    },
  },
});

Block.hasMany(Transaction);

export default Block;
