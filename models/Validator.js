import { DataTypes } from "sequelize";

const Validator = {
    timestamp: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    address: {
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
};

export default Validator;