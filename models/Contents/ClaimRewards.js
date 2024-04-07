import sequelizer from "../../db/index.js";
import { DataTypes } from "sequelize";

const ClaimRewards = sequelizer.define('cntclaim_rewards', {
    validator: {
        type: DataTypes.STRING,
        
    },
    source: {
        type: DataTypes.STRING,
        
    },
});

export default ClaimRewards;
