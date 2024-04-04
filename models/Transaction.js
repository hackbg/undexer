import { DataTypes } from "sequelize";
import sequelizer from "../db/index.js";
import Section from "./Section.js";
import Content from "./Content.js";

const Transaction = sequelizer.define('transaction', {
    chainId: {
        type: DataTypes.STRING,
    },
    expiration: {
        type: DataTypes.DATE,
    },
    timestamp: {
        type: DataTypes.DATE,
    },
    codeHash: {
        type: DataTypes.STRING,
    },
    dataHash: {
        type: DataTypes.STRING,
    },
    memoHash: {
        type: DataTypes.STRING,
    },
});

Transaction.hasOne(Section);
Transaction.hasOne(Content);

export default Transaction;