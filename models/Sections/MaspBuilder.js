import sequelizer from "../../db/index.js";
import { DataTypes } from "sequelize";

const MaspBuilder = sequelizer.define("section_masp_builder", {
    type: {
        type: DataTypes.TEXT,
    },
    target: {
        type: DataTypes.TEXT,
        
    },
    token: {
        type: DataTypes.TEXT,
        
    },
    denom: {
        type: DataTypes.TEXT,
        
    },
    position: {
        type: DataTypes.TEXT,
        
    },
});

export default MaspBuilder;
