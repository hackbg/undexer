import sequelizer from "../../db/index.js";
import { DataTypes } from "sequelize";

const ExtraData = sequelizer.define('sct_extra_data', {
    salt: {
        type: DataTypes.TEXT,
        
    },
    code: {
        type: DataTypes.TEXT,
        
    },
    tag: {
        type: DataTypes.STRING,
        
    },
});

export default ExtraData;