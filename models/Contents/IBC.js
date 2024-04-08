import sequelizer from "../../db/index.js";
import { DataTypes } from "sequelize";

const IBC = sequelizer.define('cntibc', {
    'IBC': {
        type: DataTypes.TEXT,
        
    },
})

export default IBC;
