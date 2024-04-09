import sequelizer from "../../db/index.js";
import { DataTypes } from "sequelize";

const IBC = sequelizer.define('content_ibc', {
    'IBC': {
        type: DataTypes.TEXT,
    },
})

export default IBC;
