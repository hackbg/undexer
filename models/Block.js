import { Sequelize } from 'sequelize';
import { DataTypes } from 'sequelize';
import sequelize from '../db/index.js';
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
      return this.setDataValue('header', JSON.stringify(value));
    },
  },
  results: {
    type: DataTypes.JSON,
    allowNull: false,
    get() {
      return JSON.parse(this.getDataValue('results'));
    },
    set(value) {
      return this.setDataValue('results', JSON.stringify(value));
    },
  },
  rpcResponse: {
    type: DataTypes.JSON,
    allowNull: false,
    get() {
      return JSON.parse(this.getDataValue('rpcResponse'));
    },
    set(value) {
      return this.setDataValue('rpcResponse', JSON.stringify(value));
    },
  },
});

Block.hasMany(Transaction);

export default Block;

export async function getLatestBlockInDB() {
  return (
    await Block.findAll({
      raw: true,
      attributes: [
        Sequelize.fn(
          'max',
          Sequelize.cast(Sequelize.json('header.height'), 'int'),
        ),
      ],
    })
  )[0].max;
}
