import sequelizer from "../../db/index.js";
import { DataTypes } from "sequelize";

const Withdraw = sequelizer.define("cntwithdraw", {
    validator: {
        type: DataTypes.TEXT,
    },
    source: {
        type: DataTypes.TEXT,
    },
});

export default Withdraw;
