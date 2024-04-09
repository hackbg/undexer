import sequelizer from "../../db/index.js";
import { DataTypes } from "sequelize";

const Unbond = sequelizer.define("cntunbond", {
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

export default Unbond;