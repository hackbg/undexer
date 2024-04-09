import { Sequelize } from "sequelize";
import { DataTypes } from 'sequelize';
import sequelizer from "../db/index.js";
import Transaction from './Transaction.js';

const Block = sequelizer.define('block', {
    id: {
        type: DataTypes.TEXT,
        allowNull: false,
        unique: true,
        primaryKey: true,
    },
    header: {
        type: DataTypes.JSON,
        allowNull: false,
    },
});

Block.hasMany(Transaction);

export default Block;

export async function getLatestBlockInDB () {
  return (await Block.findAll({
    raw: true,
    attributes: [
      Sequelize.fn('max', Sequelize.cast(Sequelize.json('header.height'), 'int'))
    ]
  }))[0].max
}
