import sequelizer from "../../db/index.js";
import { DataTypes } from "sequelize";

const Transfer = sequelizer.define("transfer", {
    source: {
        type: DataTypes.STRING,
    },
    target: {
        type: DataTypes.STRING,
    },
    token: {
        type: DataTypes.STRING,
    },
    amount: {
        type: DataTypes.STRING,
    },
    key: {
        type: DataTypes.STRING,
    },
    shielded: {
        type: DataTypes.STRING,
    },
});

export default Transfer;
