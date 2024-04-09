import sequelizer from "../../db/index.js";
import { DataTypes } from "sequelize";

const Withdraw = sequelizer.define("cnt_withdraw", {
    validator: {
        type: DataTypes.TEXT,
    },
    source: {
        type: DataTypes.TEXT,
    },
});

export default Withdraw;
