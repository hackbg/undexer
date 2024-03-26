import { DataTypes } from "sequelize";
import sequelizer from "../db/index.js";

const Validator = sequelizer.define('validator', {
    timestamp: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    validator: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    metadata: {
        type: DataTypes.JSON,
        allowNull: false,
    },
    stake: {
        type: DataTypes.JSON,
        allowNull: false,
    },
    commission: {
        type: DataTypes.JSON,
        allowNull: false,
    },
    state: DataTypes.ENUM("BelowThreshold", "Jailed", "Consensus"),
});

export default Validator;