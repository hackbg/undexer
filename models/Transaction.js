import { DataTypes } from "sequelize";
import sequelizer from "../db/index.js";
import Section from "./Section.js";
import Content from "./Content.js";

const Transaction = sequelizer.define('transaction', {
    txId: {
        type: DataTypes.TEXT,
    },
    chainId: {
        type: DataTypes.TEXT,
    },
    expiration: {
        type: DataTypes.DATE,
    },
    timestamp: {
        type: DataTypes.DATE,
    },
    codeHash: {
        type: DataTypes.TEXT,
    },
    dataHash: {
        type: DataTypes.TEXT,
    },
    memoHash: {
        type: DataTypes.TEXT,
    },
});

Transaction.hasOne(Section);
Transaction.hasOne(Content);

export default Transaction;
