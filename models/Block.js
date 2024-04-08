
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