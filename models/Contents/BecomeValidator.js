import sequelizer from "../../db/index.js";
import { DataTypes } from "sequelize";

const BecomeValidator = sequelizer.define("content_become_validator", {
    address: {
        type: DataTypes.TEXT,
    },
    consensusKey: {
        type: DataTypes.TEXT,
    },
    ethColdKey: {
        type: DataTypes.TEXT,
    },
    ethHotKey: {
        type: DataTypes.TEXT,
    },
    protocolKey: {
        type: DataTypes.TEXT,
    },
    commissionRate: {
        type: DataTypes.TEXT,
    },
    maxCommissionRateChange: {
        type: DataTypes.TEXT,
    },
    website: {
        type: DataTypes.TEXT,
    },
    email: {
        type: DataTypes.TEXT,
    },
    discordHandle: {
        type: DataTypes.TEXT,
    },
    avatar: {
        type: DataTypes.TEXT,
    },
    description: {
        type: DataTypes.TEXT,
    },
});

export default BecomeValidator;
