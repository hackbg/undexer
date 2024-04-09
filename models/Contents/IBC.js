import sequelizer from "../../db/index.js";
import { DataTypes } from "sequelize";

const IBC = sequelizer.define('cnt_ibc', {
    'IBC': {
        type: DataTypes.TEXT,
        
    },
})

export default IBC;
