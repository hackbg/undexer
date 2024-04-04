import sequelizer from "../../db/index.js";
import { DataTypes } from "sequelize";

const ClaimRewards = sequelizer.define('claimRewards', {
    validator: {
        type: DataTypes.STRING,
        
    },
    source: {
        type: DataTypes.STRING,
        
    },
});

export default ClaimRewards;
