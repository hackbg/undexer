import sequelizer from "../../db/index.js";
import { DataTypes } from "sequelize";

const Data = sequelizer.define('sct_data', {
    salt: {
        type: DataTypes.TEXT,
        
    },
    data: {
        type: DataTypes.TEXT,
        
    },
});

export default Data;