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
  },
});

Block.hasMany(Transaction);
Transaction.hasOne(Block);

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
