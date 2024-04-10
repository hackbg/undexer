import { DataTypes } from "sequelize";
import sequelize from "../db/index.js";

const Validator = sequelize.define('validator', {
    timestamp: {
        type: DataTypes.DATE,
    },
    validator: {
        type: DataTypes.TEXT,
    },
    metadata: {
        type: DataTypes.JSON,
    },
    stake: {
        type: DataTypes.JSON,
    },
    commission: {
        type: DataTypes.JSON,
    },
    state: DataTypes.ENUM("BelowThreshold", "BelowCapacity", "Jailed", "Consensus", "Inactive"),
});

export default Validator;