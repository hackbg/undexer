import sequelizer from "../../db/index.js";
import { DataTypes } from "sequelize";


const ChangeValidatorMetadata = sequelizer.define('cntchange_validator_metadata', {
    validator: {
        type: DataTypes.TEXT,
        
    },
    commissionRate: {
        type: DataTypes.TEXT,
        
    },
    website: {
        type: DataTypes.TEXT,
        
    },
    email: {
        type: DataTypes.TEXT,
        
    },
    discordHandle: {
        type: DataTypes.TEXT,
        
    },
    avatar: {
        type: DataTypes.TEXT,
        
    },
    description: {
        type: DataTypes.TEXT,
        
    },
});

export default ChangeValidatorMetadata;
