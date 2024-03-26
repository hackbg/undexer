
import { DataTypes } from 'sequelize';
import sequelizer from "../db/index.js";

const Block = sequelizer.define('block', {
    id: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        primaryKey: true,
    },
    header: {
        type: DataTypes.JSON,
        allowNull: false,
    },
});

export default Block;