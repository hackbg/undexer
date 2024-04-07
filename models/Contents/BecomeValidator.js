import sequelizer from "../../db/index.js";
import { DataTypes } from "sequelize";

const BecomeValidator = sequelizer.define("cnt_become_validator", {
    address: {
        type: DataTypes.STRING,
    },
    consensusKey: {
        type: DataTypes.STRING,
    },
    ethColdKey: {
        type: DataTypes.STRING,
    },
    ethHotKey: {
        type: DataTypes.STRING,
    },
    protocolKey: {
        type: DataTypes.STRING,
    },
    commissionRate: {
        type: DataTypes.STRING,
    },
    maxCommissionRateChange: {
        type: DataTypes.STRING,
    },
    website: {
        type: DataTypes.STRING,
    },
    email: {
        type: DataTypes.STRING,
    },
    discordHandle: {
        type: DataTypes.STRING,
    },
    avatar: {
        type: DataTypes.STRING,
    },
    description: {
        type: DataTypes.STRING,
    },
});

export default BecomeValidator;
