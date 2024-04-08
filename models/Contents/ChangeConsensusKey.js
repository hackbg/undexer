import sequelizer from "../../db/index.js";
import { DataTypes } from "sequelize";

const ChangeConsensusKey = sequelizer.define("cntchange_consensusKey", {
    consensusKey: {
        type: DataTypes.TEXT,
    },
    validator: {
        type: DataTypes.TEXT,
    },
});

export default ChangeConsensusKey;
