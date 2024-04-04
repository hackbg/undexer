import sequelizer from "../../db/index.js";
import { DataTypes } from "sequelize";

const Bond = sequelizer.define("bond", {
    validator: {
        type: DataTypes.STRING,
    },
    amount: {
        type: DataTypes.STRING,
    },
    source: {
        type: DataTypes.STRING,
    },
});

export default Bond;
