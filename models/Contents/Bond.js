import sequelizer from "../../db/index.js";
import { DataTypes } from "sequelize";

const Bond = sequelizer.define("cnt_bond", {
    validator: {
        type: DataTypes.TEXT,
    },
    amount: {
        type: DataTypes.TEXT,
    },
    source: {
        type: DataTypes.TEXT,
    },
});

export default Bond;
