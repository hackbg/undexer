import { DataTypes } from "sequelize";
import sequelize from "../db/index.js";
import Section from "./Section.js";
import Content from "./Content.js";
// import Block from "./Block.js";

const Transaction = sequelize.define('transaction', {
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

Transaction.hasOne(Content);
Transaction.hasMany(Section);

export default Transaction;
