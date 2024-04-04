import sequelizer from "../../db/index.js";
import { DataTypes } from "sequelize";

const MaspBuilder = sequelizer.define("maspBuilder", {
    type: {
        type: DataTypes.STRING,
        
    },
    target: {
        type: DataTypes.STRING,
        
    },
    token: {
        type: DataTypes.STRING,
        
    },
    denom: {
        type: DataTypes.STRING,
        
    },
    position: {
        type: DataTypes.STRING,
        
    },
});

export default MaspBuilder;