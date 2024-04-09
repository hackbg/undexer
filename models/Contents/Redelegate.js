import sequelizer from "../../db/index.js";
import { DataTypes } from "sequelize";

const Redelegate = sequelizer.define("content_redelegate", {
    srcValidator: {
        type: DataTypes.TEXT,
    },
    dstValidator: {
        type: DataTypes.TEXT,
    },
    owner: {
        type: DataTypes.TEXT,
    },
    amount: {
        type: DataTypes.TEXT,
    },
});

export default Redelegate;
