import sequelizer from "../../db/index.js";
import { DataTypes } from "sequelize";

const ClaimRewards = sequelizer.define('cnt_claim_rewards', {
    validator: {
        type: DataTypes.TEXT,
        
    },
    source: {
        type: DataTypes.TEXT,
        
    },
});

export default ClaimRewards;
