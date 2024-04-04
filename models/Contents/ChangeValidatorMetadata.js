import sequelizer from "../../db/index.js";
import { DataTypes } from "sequelize";


const ChangeValidatorMetadata = sequelizer.define('changeValidatorMetadata', {
    validator: {
        type: DataTypes.STRING,
        
    },
    commissionRate: {
        type: DataTypes.STRING,
        
    },
    website: {
        type: DataTypes.STRING,
        
    },
    email: {
        type: DataTypes.STRING,
        
    },
    discordHandle: {
        type: DataTypes.STRING,
        
    },
    avatar: {
        type: DataTypes.STRING,
        
    },
    description: {
        type: DataTypes.STRING,
        
    },
});

export default ChangeValidatorMetadata;
