import sequelizer from "../../db/index.js";
import { DataTypes } from "sequelize";

const IBC = sequelizer.define('ibc', {
    'IBC': {
        type: DataTypes.STRING,
        
    },
})

export default IBC;
