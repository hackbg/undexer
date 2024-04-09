import sequelizer from "../../db/index.js";
import { DataTypes } from "sequelize";

const Transfer = sequelizer.define("cnt_transfer", {
    source: {
        type: DataTypes.TEXT,
    },
    target: {
        type: DataTypes.TEXT,
    },
    token: {
        type: DataTypes.TEXT,
    },
    amount: {
        type: DataTypes.TEXT,
    },
    key: {
        type: DataTypes.TEXT,
    },
    shielded: {
        type: DataTypes.TEXT,
    },
});

export default Transfer;
