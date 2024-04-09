import sequelizer from "../../db/index.js";
import { DataTypes } from "sequelize";

const ChangeConsensusKey = sequelizer.define("content_change_consensus_key", {
    consensusKey: {
        type: DataTypes.TEXT,
    },
    validator: {
        type: DataTypes.TEXT,
    },
});

export default ChangeConsensusKey;
