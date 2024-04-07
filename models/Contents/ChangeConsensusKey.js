import sequelizer from "../../db/index.js";
import { DataTypes } from "sequelize";

const ChangeConsensusKey = sequelizer.define("cntchange_consensusKey", {
    consensusKey: {
        type: DataTypes.STRING,
    },
    validator: {
        type: DataTypes.STRING,
    },
});

export default ChangeConsensusKey;
