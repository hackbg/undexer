import { DataTypes } from "sequelize";
import sequelizer from "../db/index.js";

const Validator = sequelizer.define('validator', {
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
    state: DataTypes.ENUM("BelowThreshold", "Jailed", "Consensus", "Inactive"),
});

export default Validator;